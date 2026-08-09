using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Net;
using System.Net.Mail;
using System.Text.Json;
using TWPublishers.Backend.Models;
using TWPublishers.Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Authorization;

// Load .env file if it exists (useful for local development)
DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();

// Rate Limiter configuration
builder.Services.AddRateLimiter(options => {
    options.AddFixedWindowLimiter("login_limit", opt => {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(15);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });
});

// RSA Key Generation for JWT (RS256)
// In production, this should be loaded from Azure Key Vault or an environment variable.
var rsa = RSA.Create(2048);
var rsaKey = new RsaSecurityKey(rsa);
builder.Services.AddSingleton(rsaKey);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "twpublishers-api",
            ValidAudience = "twpublishers-dashboard",
            IssuerSigningKey = rsaKey,
            ClockSkew = TimeSpan.Zero,
            RoleClaimType = "role"
        };
    });
builder.Services.AddAuthorization();

// Get allowed origins from environment or fallback to defaults
var allowedOrigins = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS")?.Split(',') 
    ?? new[] { "http://localhost:3000", "http://localhost:3001", "https://twpublishers.co.za", "https://dashboard.twpublishers.co.za", "https://twp-pfrw.onrender.com" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
    
    options.AddPolicy("DashboardCors", policy =>
    {
        policy.WithOrigins(
            "https://dashboard.twpublishers.co.za",
            "http://localhost:3000" // dev
        )
        .AllowCredentials() // CRITICAL: allows cookies
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});

// Securely load the MongoDB connection string from environment variables
var connectionString = Environment.GetEnvironmentVariable("MONGODB_URI");
if (string.IsNullOrEmpty(connectionString))
{
    Console.WriteLine("WARNING: MONGODB_URI environment variable is not set. Database operations will fail.");
}
var client = new MongoClient(connectionString);
builder.Services.AddSingleton<IMongoClient>(client);
builder.Services.AddSingleton<IJobQueue, InMemoryJobQueue>();
builder.Services.AddSingleton<IEmailService, HttpEmailService>();
builder.Services.AddSingleton<PasswordHasher>();
builder.Services.AddHostedService<OutboxPoller>();
builder.Services.AddHostedService<JobWorker>();
builder.Services.AddHostedService<CommissionService>();

var database = client.GetDatabase("TwPublisher");

var statsCollection = database.GetCollection<LiveStats>("Stats");
var leadsCollection = database.GetCollection<Lead>("Leads");
var usersCollection = database.GetCollection<User>("Users");
var refreshTokensCollection = database.GetCollection<RefreshToken>("RefreshTokens");
var activitiesCollection = database.GetCollection<ActivityLog>("Activities");
var dailyStatsCollection = database.GetCollection<DailyStat>("DailyStats");
var outboxCollection = database.GetCollection<OutboxEvent>("Outbox");
var idempotencyCollection = database.GetCollection<IdempotencyRecord>("Idempotency");
var referralPartnersCollection = database.GetCollection<ReferralPartner>("ReferralPartners");
var commissionTiersCollection = database.GetCollection<CommissionTier>("CommissionTiers");
var commissionsCollection = database.GetCollection<Commission>("Commissions");
var auditLogsCollection = database.GetCollection<AuditLog>("AuditLogs");
var invitesCollection = database.GetCollection<InviteToken>("Invites");
var partnerActivitiesCollection = database.GetCollection<PartnerActivity>("PartnerActivities");
var outreachScriptsCollection = database.GetCollection<OutreachScript>("OutreachScripts");

// Setup Indexes
outboxCollection.Indexes.CreateOne(new CreateIndexModel<OutboxEvent>(
    Builders<OutboxEvent>.IndexKeys.Ascending(x => x.ProcessedAt)));
    
idempotencyCollection.Indexes.CreateOne(new CreateIndexModel<IdempotencyRecord>(
    Builders<IdempotencyRecord>.IndexKeys.Ascending(x => x.Key), 
    new CreateIndexOptions { Unique = true }));

referralPartnersCollection.Indexes.CreateOne(new CreateIndexModel<ReferralPartner>(
    Builders<ReferralPartner>.IndexKeys.Ascending(x => x.PartnerCode), 
    new CreateIndexOptions { Unique = true }));

// Seed Initial Data
if (commissionTiersCollection.CountDocuments(FilterDefinition<CommissionTier>.Empty) == 0)
{
    commissionTiersCollection.InsertMany(new[]
    {
        new CommissionTier { TierName = "Origin", CommissionUsd = 15 },
        new CommissionTier { TierName = "Book Launch", CommissionUsd = 15 },
        new CommissionTier { TierName = "Elevate", CommissionUsd = 100 },
        new CommissionTier { TierName = "Authority", CommissionUsd = 180 },
        new CommissionTier { TierName = "Empire", CommissionUsd = 400 }
    });
}
if (statsCollection.CountDocuments(FilterDefinition<LiveStats>.Empty) == 0)
    statsCollection.InsertOne(new LiveStats());

if (usersCollection.CountDocuments(FilterDefinition<User>.Empty) == 0)
{
    usersCollection.InsertOne(new User { Username = "admin", Email = "hello@twpublishers.co.za", Password = "password123", Role = "admin", Name = "Webster Tsenase" });
    usersCollection.InsertOne(new User { Username = "dev", Email = "shawnchareka7@gmail.com", Password = "dev123", Role = "developer", Name = "Shawn Chareka" });
}

if (dailyStatsCollection.CountDocuments(FilterDefinition<DailyStat>.Empty) == 0)
{
    // Seed some initial chart data so the dashboard isn't empty on day 1
    var seedData = new[]
    {
        new DailyStat { Date = DateTime.UtcNow.AddDays(-6).ToString("yyyy-MM-dd"), Name = DateTime.UtcNow.AddDays(-6).ToString("ddd"), Sales = 42, Traffic = 2400, Revenue = 210000 },
        new DailyStat { Date = DateTime.UtcNow.AddDays(-5).ToString("yyyy-MM-dd"), Name = DateTime.UtcNow.AddDays(-5).ToString("ddd"), Sales = 30, Traffic = 1398, Revenue = 150000 },
        new DailyStat { Date = DateTime.UtcNow.AddDays(-4).ToString("yyyy-MM-dd"), Name = DateTime.UtcNow.AddDays(-4).ToString("ddd"), Sales = 58, Traffic = 9800, Revenue = 290000 },
        new DailyStat { Date = DateTime.UtcNow.AddDays(-3).ToString("yyyy-MM-dd"), Name = DateTime.UtcNow.AddDays(-3).ToString("ddd"), Sales = 38, Traffic = 3908, Revenue = 190000 },
        new DailyStat { Date = DateTime.UtcNow.AddDays(-2).ToString("yyyy-MM-dd"), Name = DateTime.UtcNow.AddDays(-2).ToString("ddd"), Sales = 48, Traffic = 4800, Revenue = 240000 },
        new DailyStat { Date = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-dd"), Name = DateTime.UtcNow.AddDays(-1).ToString("ddd"), Sales = 38, Traffic = 3800, Revenue = 190000 }
    };
    dailyStatsCollection.InsertMany(seedData);
}

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowFrontend");
app.UseCors("DashboardCors");

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");

// Helpers
async Task RecordActivity(string type, string message, decimal? amount = null, IClientSessionHandle? session = null)
{
    var log = new ActivityLog { Type = type, Message = message, Amount = amount };
    if (session != null)
        await activitiesCollection.InsertOneAsync(session, log);
    else
        await activitiesCollection.InsertOneAsync(log);
}

async Task RecordTraffic()
{
    var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
    var name = DateTime.UtcNow.ToString("ddd");
    var filter = Builders<DailyStat>.Filter.Eq(s => s.Date, today);
    var update = Builders<DailyStat>.Update.SetOnInsert(s => s.Date, today).SetOnInsert(s => s.Name, name).Inc(s => s.Traffic, 1);
    await dailyStatsCollection.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = true });
}

async Task RecordSale(decimal amount)
{
    var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
    var name = DateTime.UtcNow.ToString("ddd");
    var filter = Builders<DailyStat>.Filter.Eq(s => s.Date, today);
    var update = Builders<DailyStat>.Update.SetOnInsert(s => s.Date, today).SetOnInsert(s => s.Name, name).Inc(s => s.Sales, 1).Inc(s => s.Revenue, amount);
    await dailyStatsCollection.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = true });
}

  app.MapGet("/api/stats", [Authorize(Roles = "admin,super_admin,client_admin")] async (HttpContext ctx) => 
  {
      try 
      {
          var stats = await statsCollection.Find(FilterDefinition<LiveStats>.Empty).FirstOrDefaultAsync();
          var chartData = await dailyStatsCollection.Find(FilterDefinition<DailyStat>.Empty).SortBy(d => d.Date).Limit(7).ToListAsync();
          
          if (stats == null) 
          {
              return Results.Ok(new {
                  grossRevenue = 0,
                  websiteVisitors = 0,
                  packagesSold = 0,
                  consultationsBooked = 0,
                  chartData = chartData ?? new List<DailyStat>()
              });
          }
      
          return Results.Ok(new {
              grossRevenue = stats.grossRevenue,
              websiteVisitors = stats.websiteVisitors,
              packagesSold = stats.packagesSold,
              consultationsBooked = stats.consultationsBooked,
              chartData = chartData ?? new List<DailyStat>()
          });
      }
      catch (Exception ex)
      {
          Console.WriteLine($"Error in /api/stats: {ex}");
          ctx.Response.StatusCode = 500;
          return Results.Json(new { error = ex.Message, stackTrace = ex.StackTrace });
      }
  });

// 2. Payfast Webhook Endpoint
app.MapPost("/api/payfast/webhook", async (HttpRequest request) =>
{
    var form = await request.ReadFormAsync();
    var paymentStatus = form["payment_status"];
    var amountGross = form["amount_gross"];
    
    if (paymentStatus == "COMPLETE")
    {
        var incrementAmount = decimal.TryParse(amountGross, out var amount) ? amount : 2000m;
        var update = Builders<LiveStats>.Update.Inc(s => s.packagesSold, 1).Inc(s => s.grossRevenue, incrementAmount);
        await statsCollection.UpdateOneAsync(FilterDefinition<LiveStats>.Empty, update);
        
        await RecordSale(incrementAmount);
        await RecordActivity("sale", $"New package sold for R{amountGross}", incrementAmount);
        
        return Results.Ok();
    }
    return Results.BadRequest("Payment not complete.");
});

// 3. Auth Endpoints
string GenerateJwt(User user, RsaSecurityKey key)
{
    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id ?? ""),
        new Claim(ClaimTypes.Role, user.Role)
    };
    var token = new JwtSecurityToken(
        issuer: "twpublishers-api",
        audience: "twpublishers-dashboard",
        claims: claims,
        expires: DateTime.UtcNow.AddMinutes(15),
        signingCredentials: new SigningCredentials(key, SecurityAlgorithms.RsaSha256)
    );
    return new JwtSecurityTokenHandler().WriteToken(token);
}

app.MapPost("/api/auth/migrate-passwords", async (PasswordHasher hasher) =>
{
    // One-time migration for passwords and emails
    var usersToMigrate = await usersCollection.Find(FilterDefinition<User>.Empty).ToListAsync();
    foreach (var user in usersToMigrate)
    {
        var updateDef = Builders<User>.Update;
        var updates = new List<UpdateDefinition<User>>();

        if (!user.Password.StartsWith("$argon2id"))
            updates.Add(updateDef.Set(u => u.Password, hasher.Hash(user.Password)));
            
        if (string.IsNullOrEmpty(user.Email))
        {
            if (user.Username == "admin") updates.Add(updateDef.Set(u => u.Email, "hello@twpublishers.co.za"));
            else if (user.Username == "dev") updates.Add(updateDef.Set(u => u.Email, "shawnchareka7@gmail.com"));
        }

        if (updates.Any())
        {
            await usersCollection.UpdateOneAsync(
                u => u.Id == user.Id,
                updateDef.Combine(updates)
            );
        }
    }
    return Results.Ok(new { migrated = usersToMigrate.Count });
});

app.MapPost("/api/auth/invite", [Authorize(Roles = "admin,super_admin")] async (HttpContext ctx, [FromBody] InviteRequest req) =>
{
    var tokenStr = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)).Replace("+", "").Replace("/", "").Replace("=", "");
    var invite = new InviteToken
    {
        Token = tokenStr,
        Role = req.Role,
        CreatedBy = ctx.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "admin"
    };
    await invitesCollection.InsertOneAsync(invite);
    return Results.Ok(new { inviteToken = tokenStr });
});

app.MapPost("/api/auth/signup", async ([FromBody] SignupRequest req, PasswordHasher hasher) =>
{
    req.Username = req.Username?.Trim().ToLower() ?? "";
    req.Email = req.Email?.Trim().ToLower() ?? "";
    req.Name = req.Name?.Trim() ?? "";

    if (string.IsNullOrEmpty(req.Email) || string.IsNullOrEmpty(req.Password))
        return Results.BadRequest("Email and password are required.");

    var invite = await invitesCollection.Find(i => i.Token == req.InviteToken && !i.IsUsed).FirstOrDefaultAsync();
    if (invite == null || invite.ExpiresAt < DateTime.UtcNow) return Results.BadRequest("Invalid or expired invite token.");

    if (await usersCollection.Find(u => u.Username == req.Username || u.Email == req.Email).AnyAsync())
        return Results.BadRequest("Username or email already exists.");

    var user = new User
    {
        Username = req.Username,
        Email = req.Email,
        Name = req.Name,
        Password = hasher.Hash(req.Password),
        Role = invite.Role
    };
    await usersCollection.InsertOneAsync(user);
    
    if (user.Role == "referral_partner")
    {
        var safeUsername = new string(user.Username.Where(char.IsLetterOrDigit).ToArray()).ToUpper();
        var randomSuffix = new Random().Next(100, 999).ToString();
        var partnerCode = $"{safeUsername}-{randomSuffix}";

        var partner = new ReferralPartner
        {
            PartnerName = user.Name,
            ContactEmail = user.Email,
            PartnerCode = partnerCode
        };
        await referralPartnersCollection.InsertOneAsync(partner);
    }

    
    await invitesCollection.UpdateOneAsync(i => i.Id == invite.Id, Builders<InviteToken>.Update.Set(i => i.IsUsed, true));
    return Results.Ok(new { success = true });
});

app.MapPost("/api/auth/forgot-password", async ([FromBody] ForgotPasswordRequest req, IEmailService emailService) =>
{
    var user = await usersCollection.Find(u => u.Email == req.Email).FirstOrDefaultAsync();
    if (user != null)
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)).Replace("+", "").Replace("/", "").Replace("=", "");
        var expiry = DateTime.UtcNow.AddHours(1);
        await usersCollection.UpdateOneAsync(u => u.Id == user.Id, Builders<User>.Update.Set(u => u.PasswordResetToken, token).Set(u => u.PasswordResetExpiry, expiry));
        
        var resetLink = $"https://dashboard.twpublishers.co.za/reset-password?token={token}";
        await emailService.SendEmailAsync(user.Email, "TW Publishers - Password Reset", $"Click here to reset your password: {resetLink}", Guid.NewGuid().ToString());
    }
    return Results.Ok(new { success = true, message = "If an account exists, a reset email has been sent." });
});

app.MapPost("/api/auth/reset-password", async ([FromBody] ResetPasswordRequest req, PasswordHasher hasher) =>
{
    var user = await usersCollection.Find(u => u.PasswordResetToken == req.Token && u.PasswordResetExpiry > DateTime.UtcNow).FirstOrDefaultAsync();
    if (user == null) return Results.BadRequest("Invalid or expired reset token.");

    await usersCollection.UpdateOneAsync(u => u.Id == user.Id, Builders<User>.Update.Set(u => u.Password, hasher.Hash(req.NewPassword)).Set(u => u.PasswordResetToken, null).Set(u => u.PasswordResetExpiry, null));
    return Results.Ok(new { success = true });
});

app.MapPost("/api/auth/login", async (HttpContext ctx, [FromBody] LoginRequest req, PasswordHasher hasher, RsaSecurityKey key, IWebHostEnvironment env) =>
{
    var turnstileSecret = Environment.GetEnvironmentVariable("TURNSTILE_SECRET_KEY");
    if (!string.IsNullOrEmpty(turnstileSecret))
    {
        if (string.IsNullOrEmpty(req.TurnstileToken)) return Results.BadRequest("Missing security token.");
        
        using var http = new HttpClient();
        var content = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("secret", turnstileSecret),
            new KeyValuePair<string, string>("response", req.TurnstileToken)
        });
        var res = await http.PostAsync("https://challenges.cloudflare.com/turnstile/v0/siteverify", content);
        var json = await res.Content.ReadAsStringAsync();
        if (!json.Contains("\"success\": true") && !json.Contains("\"success\":true"))
        {
            return Results.BadRequest("Security check failed.");
        }
    }

    req.Username = req.Username?.Trim().ToLower() ?? "";
    var user = await usersCollection.Find(u => u.Username == req.Username || u.Email == req.Username).FirstOrDefaultAsync();
    if (user == null || !hasher.Verify(req.Password, user.Password))
    {
        await auditLogsCollection.InsertOneAsync(new AuditLog { Action = "login_failure", Details = "Invalid credentials", IpAddress = ctx.Connection.RemoteIpAddress?.ToString() ?? "", Timestamp = DateTime.UtcNow });
        return Results.Unauthorized();
    }

    if (user.IsTwoFactorEnabled)
    {
        return Results.Ok(new { success = true, mfa_required = true, userId = user.Id });
    }

    var accessToken = GenerateJwt(user, key);
    
    // Generate refresh token
    var refreshTokenStr = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
    var ip = ctx.Connection.RemoteIpAddress?.ToString() ?? "";
    var ua = ctx.Request.Headers["User-Agent"].ToString() ?? "";
    
    var refreshToken = new RefreshToken
    {
        UserId = user.Id ?? "",
        Token = refreshTokenStr,
        Expires = DateTime.UtcNow.AddDays(7),
        CreatedByIp = ip,
        CreatedByUserAgent = ua
    };
    await refreshTokensCollection.InsertOneAsync(refreshToken);
    
    await auditLogsCollection.InsertOneAsync(new AuditLog { UserId = user.Id ?? "", Action = user.Role == "referral_partner" ? "partner_login" : "login_success", IpAddress = ip, UserAgent = ua, Timestamp = DateTime.UtcNow });

    var cookieOptions = new CookieOptions
    {
        HttpOnly = true,
        SameSite = SameSiteMode.None,
        Secure = true,
        Expires = DateTime.UtcNow.AddDays(7),
        Path = "/api/auth/refresh"
    };
    ctx.Response.Cookies.Append("refresh", refreshTokenStr, cookieOptions);

    return Results.Ok(new { success = true, role = user.Role, name = user.Name, accessToken = accessToken });
}).RequireRateLimiting("login_limit");

app.MapPost("/api/auth/login/mfa", async (HttpContext ctx, [FromBody] MfaLoginRequest req, RsaSecurityKey key, IWebHostEnvironment env) =>
{
    var user = await usersCollection.Find(u => u.Id == req.UserId).FirstOrDefaultAsync();
    if (user == null || !user.IsTwoFactorEnabled || string.IsNullOrEmpty(user.TwoFactorSecret)) return Results.Unauthorized();

    var totp = new OtpNet.Totp(OtpNet.Base32Encoding.ToBytes(user.TwoFactorSecret));
    if (!totp.VerifyTotp(req.Code, out long timeStepMatched, new OtpNet.VerificationWindow(2, 2)))
    {
        return Results.BadRequest("Invalid 2FA code.");
    }

    var accessToken = GenerateJwt(user, key);
    
    var refreshTokenStr = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
    var ip = ctx.Connection.RemoteIpAddress?.ToString() ?? "";
    var ua = ctx.Request.Headers["User-Agent"].ToString() ?? "";
    
    var refreshToken = new RefreshToken
    {
        UserId = user.Id ?? "",
        Token = refreshTokenStr,
        Expires = DateTime.UtcNow.AddDays(7),
        CreatedByIp = ip,
        CreatedByUserAgent = ua
    };
    await refreshTokensCollection.InsertOneAsync(refreshToken);
    
    await auditLogsCollection.InsertOneAsync(new AuditLog { UserId = user.Id ?? "", Action = user.Role == "referral_partner" ? "partner_login" : "login_success_mfa", IpAddress = ip, UserAgent = ua, Timestamp = DateTime.UtcNow });

    var cookieOptions = new CookieOptions { HttpOnly = true, SameSite = SameSiteMode.None, Secure = true, Expires = DateTime.UtcNow.AddDays(7), Path = "/api/auth/refresh" };
    ctx.Response.Cookies.Append("refresh", refreshTokenStr, cookieOptions);

    return Results.Ok(new { success = true, role = user.Role, name = user.Name, accessToken = accessToken });
}).RequireRateLimiting("login_limit");

app.MapPost("/api/auth/mfa/setup", [Authorize] async (HttpContext ctx) =>
{
    var userId = ctx.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    var user = await usersCollection.Find(u => u.Id == userId).FirstOrDefaultAsync();
    if (user == null) return Results.Unauthorized();

    var secretKey = OtpNet.KeyGeneration.GenerateRandomKey(20);
    var base32Secret = OtpNet.Base32Encoding.ToString(secretKey);
    
    // Store temporarily until verified
    await usersCollection.UpdateOneAsync(u => u.Id == user.Id, Builders<User>.Update.Set(u => u.TwoFactorSecret, base32Secret));

    // Generate URI for QR code
    var qrUri = $"otpauth://totp/TWPublishers:{user.Email}?secret={base32Secret}&issuer=TWPublishers";

    return Results.Ok(new { secret = base32Secret, uri = qrUri });
});

app.MapPost("/api/auth/mfa/verify", [Authorize] async (HttpContext ctx, [FromBody] VerifyMfaRequest req) =>
{
    var userId = ctx.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    var user = await usersCollection.Find(u => u.Id == userId).FirstOrDefaultAsync();
    if (user == null || string.IsNullOrEmpty(user.TwoFactorSecret)) return Results.Unauthorized();

    var totp = new OtpNet.Totp(OtpNet.Base32Encoding.ToBytes(user.TwoFactorSecret));
    if (totp.VerifyTotp(req.Code, out long timeStepMatched, new OtpNet.VerificationWindow(2, 2)))
    {
        await usersCollection.UpdateOneAsync(u => u.Id == user.Id, Builders<User>.Update.Set(u => u.IsTwoFactorEnabled, true));
        return Results.Ok(new { success = true });
    }
    return Results.BadRequest("Invalid 2FA code.");
});

app.MapPost("/api/auth/refresh", async (HttpContext ctx, RsaSecurityKey key, IWebHostEnvironment env) =>
{
    ctx.Request.Cookies.TryGetValue("refresh", out var cookieToken);
    if (string.IsNullOrEmpty(cookieToken)) return Results.Unauthorized();

    var storedToken = await refreshTokensCollection.Find(t => t.Token == cookieToken).FirstOrDefaultAsync();
    if (storedToken == null || storedToken.IsRevoked || storedToken.Expires < DateTime.UtcNow)
        return Results.Unauthorized();

    var currentIp = ctx.Connection.RemoteIpAddress?.ToString() ?? "";
    var currentUA = ctx.Request.Headers["User-Agent"].ToString() ?? "";

    if (storedToken.CreatedByIp != currentIp || storedToken.CreatedByUserAgent != currentUA)
    {
        // Anomaly detected: revoke all user's tokens
        var update = Builders<RefreshToken>.Update.Set(t => t.IsRevoked, true).Set(t => t.RevokedAt, DateTime.UtcNow);
        await refreshTokensCollection.UpdateManyAsync(t => t.UserId == storedToken.UserId, update);
        await auditLogsCollection.InsertOneAsync(new AuditLog { UserId = storedToken.UserId, Action = "anomaly_detected", Details = "IP or UA changed during refresh. Revoked all tokens.", IpAddress = currentIp, UserAgent = currentUA, Timestamp = DateTime.UtcNow });
        return Results.Unauthorized();
    }

    var user = await usersCollection.Find(u => u.Id == storedToken.UserId).FirstOrDefaultAsync();
    if (user == null) return Results.Unauthorized();

    // Revoke old and create new (Rotation)
    await refreshTokensCollection.UpdateOneAsync(t => t.Id == storedToken.Id, Builders<RefreshToken>.Update.Set(t => t.IsRevoked, true).Set(t => t.RevokedAt, DateTime.UtcNow));
    
    var newRefreshTokenStr = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
    var newRefreshToken = new RefreshToken
    {
        UserId = user.Id ?? "",
        Token = newRefreshTokenStr,
        Expires = DateTime.UtcNow.AddDays(7),
        CreatedByIp = currentIp,
        CreatedByUserAgent = currentUA
    };
    await refreshTokensCollection.InsertOneAsync(newRefreshToken);

    var cookieOptions = new CookieOptions
    {
        HttpOnly = true,
        SameSite = SameSiteMode.None,
        Secure = true,
        Expires = DateTime.UtcNow.AddDays(7),
        Path = "/api/auth/refresh"
    };
    ctx.Response.Cookies.Append("refresh", newRefreshTokenStr, cookieOptions);

    return Results.Ok(new { success = true, role = user.Role, name = user.Name, accessToken = GenerateJwt(user, key) });
});

// 4. Tracking Endpoint
app.MapPost("/api/track/visitor", async () =>
{
    var update = Builders<LiveStats>.Update.Inc(s => s.websiteVisitors, 1);
    await statsCollection.UpdateOneAsync(FilterDefinition<LiveStats>.Empty, update);
    await RecordTraffic();
    // Don't log every visitor to ActivityLog to avoid spam
    return Results.Ok(new { success = true });
});

app.MapPost("/api/consultations", async (HttpRequest request, [FromBody] ConsultationRequest req, IJobQueue jobQueue) =>
{
    using var session = await client.StartSessionAsync();
    session.StartTransaction();
    
    try
    {
        // 1. Read Referral Cookie (Secure against spoofing)
        request.Cookies.TryGetValue("twp_ref", out string? partnerCode);
        
        // 2. Validate Referral Partner (optional, but good for data integrity)
        if (!string.IsNullOrEmpty(partnerCode))
        {
            var partner = await referralPartnersCollection.Find(p => p.PartnerCode == partnerCode && p.Status == "active").FirstOrDefaultAsync();
            if (partner == null) partnerCode = ""; // invalid or terminated, ignore
        }

        var lead = new Lead
        {
            FullName = req.Name,
            Email = req.Email,
            Phone = req.Phone,
            CompanyOrBookTitle = req.Message, // Mapping message to company/book title for now
            Subject = req.Subject,
            ReferralPartnerCode = partnerCode ?? "",
            FormSubmittedAt = DateTime.UtcNow
        };

        // 1. Insert Lead
        await leadsCollection.InsertOneAsync(session, lead);
        
        // 2. Insert Audit Log
        var audit = new AuditLog
        {
            EntityType = "Lead",
            EntityId = lead.Id ?? "",
            Action = "created",
            PerformedBy = "system",
            Details = JsonSerializer.Serialize(new { partnerCode = lead.ReferralPartnerCode })
        };
        await auditLogsCollection.InsertOneAsync(session, audit);

        // 3. Update Stats
        var update = Builders<LiveStats>.Update.Inc(s => s.consultationsBooked, 1);
        await statsCollection.UpdateOneAsync(session, FilterDefinition<LiveStats>.Empty, update);
        
        // 4. Record Activity
        await RecordActivity("consultation", $"New lead created for {req.Name}", null, session);
        
        // 5. Insert Outbox Event
        var outboxEvent = new OutboxEvent
        {
            Topic = "form.submitted",
            PayloadJson = JsonSerializer.Serialize(new { 
                consultationId = lead.Id, 
                name = req.Name, 
                email = req.Email, 
                phone = req.Phone,
                message = req.Message, 
                subject = req.Subject,
                createdAt = lead.CreatedAt 
            }),
            IdempotencyKey = $"form_email_{lead.Id}"
        };
        await outboxCollection.InsertOneAsync(session, outboxEvent);

        // Commit transaction
        await session.CommitTransactionAsync();
        
        jobQueue.Enqueue(new JobMessage
        {
            OutboxEventId = outboxEvent.Id.ToString(),
            PayloadJson = outboxEvent.PayloadJson,
            IdempotencyKey = outboxEvent.IdempotencyKey,
            TraceId = Guid.NewGuid().ToString()
        });

        return Results.Ok(new { success = true });
    }
    catch (Exception ex)
    {
        await session.AbortTransactionAsync();
        Console.WriteLine($"Transaction failed: {ex.Message}");
        return Results.Problem("An error occurred while saving the consultation.");
    }
});

// 6. GET consultations
app.MapGet("/api/consultations", [Authorize(Roles = "admin,super_admin,client_admin")] async (HttpContext ctx) =>
{
    var role = ctx.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "";
    var leads = await leadsCollection.Find(FilterDefinition<Lead>.Empty).SortByDescending(c => c.CreatedAt).Limit(50).ToListAsync();
    
    if (role == "client_admin")
    {
        var sanitizedLeads = leads.Select(l => new {
            l.Id,
            l.FullName,
            l.Email,
            l.Phone,
            l.Subject,
            l.CompanyOrBookTitle,
            l.LinkedInUrl,
            ReferralPartnerCode = string.IsNullOrEmpty(l.ReferralPartnerCode) ? "" : "System", // Data Isolation
            l.PackageTier,
            l.Status,
            l.CreatedAt,
            l.FormSubmittedAt
        });
        return Results.Ok(new { leads = sanitizedLeads });
    }

    return Results.Ok(new { leads });
});

// 7. GET Activities
app.MapGet("/api/activity", [Authorize(Roles = "admin,super_admin,client_admin")] async () =>
{
    var activities = await activitiesCollection.Find(FilterDefinition<ActivityLog>.Empty).SortByDescending(a => a.Timestamp).Limit(50).ToListAsync();
    return Results.Ok(activities);
});

// 8. User Management
app.MapGet("/api/users", [Authorize(Roles = "admin,super_admin")] async () =>
{
    var users = await usersCollection.Find(FilterDefinition<User>.Empty).SortByDescending(u => u.CreatedAt).ToListAsync();
    return Results.Ok(users.Select(u => new { u.Id, u.Username, u.Name, u.Role, u.CreatedAt }));
});

app.MapPost("/api/users", [Authorize(Roles = "admin,super_admin")] async ([FromBody] User newUser) =>
{
    // Check if exists
    var existing = await usersCollection.Find(u => u.Username == newUser.Username).FirstOrDefaultAsync();
    if (existing != null) return Results.BadRequest("Username already exists");
    
    await usersCollection.InsertOneAsync(newUser);
    return Results.Ok(new { success = true });
});

app.MapDelete("/api/users/{id}", [Authorize(Roles = "admin,super_admin")] async (string id) =>
{
    await usersCollection.DeleteOneAsync(u => u.Id == id);
    return Results.Ok(new { success = true });
});

// 9. Referral Dashboard
app.MapGet("/api/admin/referrals/dashboard", [Authorize(Roles = "admin,super_admin,client_admin")] async () =>
{
    var partners = await referralPartnersCollection.Find(FilterDefinition<ReferralPartner>.Empty).ToListAsync();
    var allLeads = await leadsCollection.Find(l => l.ReferralPartnerCode != "").ToListAsync();
    var allCommissions = await commissionsCollection.Find(FilterDefinition<Commission>.Empty).ToListAsync();

    var result = partners.Select(p => {
        var partnerLeads = allLeads.Where(l => l.ReferralPartnerCode == p.PartnerCode).ToList();
        var partnerCommissions = allCommissions.Where(c => c.PartnerCode == p.PartnerCode).ToList();
        
        return new {
            partnerCode = p.PartnerCode,
            partnerName = p.PartnerName,
            status = p.Status,
            totalClicks = 0, // Can be implemented with a separate tracking table later
            totalFormFills = partnerLeads.Count,
            totalDealsClosed = partnerLeads.Count(l => l.Status == "closed_won"),
            totalCommissionUsd = partnerCommissions.Sum(c => c.CommissionUsd),
            totalCommissionZar = partnerCommissions.Sum(c => c.CommissionZar),
            pendingCommissionZar = partnerCommissions.Where(c => c.Status == "pending").Sum(c => c.CommissionZar),
            paidCommissionZar = partnerCommissions.Where(c => c.Status == "paid").Sum(c => c.CommissionZar)
        };
    });

    return Results.Ok(new { partners = result });
});

app.MapGet("/", () => "TWPublishers Backend is running");
// 10. Partner Dashboard
app.MapGet("/api/partner/dashboard", [Authorize(Roles = "referral_partner")] async (HttpContext ctx) =>
{
    var userId = ctx.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var user = await usersCollection.Find(u => u.Id == userId).FirstOrDefaultAsync();
    if (user == null) return Results.Unauthorized();

    var partner = await referralPartnersCollection.Find(p => p.ContactEmail == user.Email).FirstOrDefaultAsync();
    if (partner == null) return Results.NotFound("Referral partner profile not found.");

    var partnerLeads = await leadsCollection.Find(l => l.ReferralPartnerCode == partner.PartnerCode).SortByDescending(l => l.CreatedAt).ToListAsync();
    var partnerCommissions = await commissionsCollection.Find(c => c.PartnerCode == partner.PartnerCode).SortByDescending(c => c.CreatedAt).ToListAsync();

    return Results.Ok(new {
        partnerCode = partner.PartnerCode,
        partnerName = partner.PartnerName,
        status = partner.Status,
        totalFormFills = partnerLeads.Count,
        totalDealsClosed = partnerLeads.Count(l => l.Status == "closed_won"),
        totalCommissionZar = partnerCommissions.Sum(c => c.CommissionZar),
        pendingCommissionZar = partnerCommissions.Where(c => c.Status == "pending").Sum(c => c.CommissionZar),
        paidCommissionZar = partnerCommissions.Where(c => c.Status == "paid").Sum(c => c.CommissionZar),
        leads = partnerLeads.Select(l => new { l.Id, l.CompanyOrBookTitle, l.Status, l.CreatedAt }),
        commissions = partnerCommissions.Select(c => new { c.Id, c.PackageTier, c.CommissionZar, c.Status, c.CreatedAt })
    });
});

// POST /api/partner/activity
app.MapPost("/api/partner/activity", [Authorize(Roles = "referral_partner")] async (HttpContext ctx, [FromBody] PartnerActivity req) =>
{
    var partnerCode = ctx.User.FindFirst("partner_code")?.Value;
    if (string.IsNullOrEmpty(partnerCode)) return Results.Unauthorized();

    var partner = await referralPartnersCollection.Find(p => p.PartnerCode == partnerCode).FirstOrDefaultAsync();
    if (partner == null) return Results.Unauthorized();

    // Create or update today's activity
    var today = DateTime.UtcNow.Date;
    var existingActivity = await partnerActivitiesCollection.Find(a => a.PartnerCode == partnerCode && a.Date == today).FirstOrDefaultAsync();
    
    req.PartnerCode = partnerCode;
    req.Date = today;
    req.HitMinimum = req.MessagesSent >= 30;
    req.CreatedAt = DateTime.UtcNow;

    if (existingActivity != null)
    {
        req.Id = existingActivity.Id;
        req.CreatedAt = existingActivity.CreatedAt;
        await partnerActivitiesCollection.ReplaceOneAsync(a => a.Id == existingActivity.Id, req);
    }
    else
    {
        await partnerActivitiesCollection.InsertOneAsync(req);
        if (req.HitMinimum)
        {
            partner.CurrentStreak++;
        }
        else
        {
            partner.CurrentStreak = 0;
        }
    }

    partner.LastActivityAt = DateTime.UtcNow;
    partner.Status = "active";
    partner.UpdatedAt = DateTime.UtcNow;
    await referralPartnersCollection.ReplaceOneAsync(p => p.Id == partner.Id, partner);

    return Results.Ok(new { success = true, streak = partner.CurrentStreak });
});

// Admin: Upload Batch of Leads for a Partner
app.MapPost("/api/admin/leads/batch", [Authorize(Roles = "admin,super_admin")] async ([FromBody] List<Lead> batch, HttpContext ctx) =>
{
    if (batch == null || batch.Count == 0) return Results.BadRequest("Empty batch");
    
    foreach (var lead in batch)
    {
        lead.Status = "new";
        lead.CreatedAt = DateTime.UtcNow;
        lead.FormSubmittedAt = DateTime.UtcNow;
    }
    
    await leadsCollection.InsertManyAsync(batch);
    return Results.Ok(new { success = true, count = batch.Count });
});

// Admin: Get Scripts
app.MapGet("/api/admin/scripts", [Authorize(Roles = "admin,super_admin")] async () =>
{
    var scripts = await outreachScriptsCollection.Find(FilterDefinition<OutreachScript>.Empty).ToListAsync();
    return Results.Ok(scripts);
});

// Admin: Create/Update Script
app.MapPost("/api/admin/scripts", [Authorize(Roles = "admin,super_admin")] async ([FromBody] OutreachScript script) =>
{
    script.CreatedAt = DateTime.UtcNow;
    await outreachScriptsCollection.InsertOneAsync(script);
    return Results.Ok(script);
});

// Partner: Get Assigned Leads
app.MapGet("/api/partner/leads", [Authorize(Roles = "referral_partner")] async (HttpContext ctx) =>
{
    var partnerCode = ctx.User.FindFirst("partner_code")?.Value;
    if (string.IsNullOrEmpty(partnerCode)) return Results.Unauthorized();

    var partnerLeads = await leadsCollection.Find(l => l.ReferralPartnerCode == partnerCode).ToListAsync();
    return Results.Ok(partnerLeads);
});

// Partner: Get Scripts
app.MapGet("/api/partner/scripts", [Authorize(Roles = "referral_partner")] async () =>
{
    var scripts = await outreachScriptsCollection.Find(FilterDefinition<OutreachScript>.Empty).ToListAsync();
    return Results.Ok(scripts);
});

// Admin: View Partner Pipeline
app.MapGet("/api/admin/partner-pipeline/{partnerCode}", [Authorize(Roles = "admin,super_admin")] async (string partnerCode) =>
{
    var leads = await leadsCollection.Find(l => l.ReferralPartnerCode == partnerCode).SortByDescending(l => l.CreatedAt).ToListAsync();
    return Results.Ok(leads);
});


// Partner: Update Lead Status
app.MapPost("/api/partner/leads/{id}/status", [Authorize(Roles = "referral_partner")] async (string id, [FromBody] StatusUpdateRequest req, HttpContext ctx) =>
{
    var partnerCode = ctx.User.FindFirst("partner_code")?.Value;
    if (string.IsNullOrEmpty(partnerCode)) return Results.Unauthorized();

    var lead = await leadsCollection.Find(l => l.Id == id && l.ReferralPartnerCode == partnerCode).FirstOrDefaultAsync();
    if (lead == null) return Results.NotFound();

    var oldStatus = lead.Status;
    lead.Status = req.Status;
    
    var update = Builders<Lead>.Update.Set(l => l.Status, req.Status);
    await leadsCollection.UpdateOneAsync(l => l.Id == id, update);

    var auditLog = new AuditLog
    {
        EntityType = "Lead",
        EntityId = id,
        UserId = partnerCode,
        Action = "status_changed",
        PerformedBy = partnerCode,
        Details = System.Text.Json.JsonSerializer.Serialize(new { old_status = oldStatus, new_status = req.Status })
    };
    await auditLogsCollection.InsertOneAsync(auditLog);

    return Results.Ok(new { success = true });
});

app.Run();

// Email logic moved to SmtpEmailService and JobWorker

// Models
class LoginRequest { public string Username { get; set; } = ""; public string Password { get; set; } = ""; public string TurnstileToken { get; set; } = ""; }

class ConsultationRequest { public string Name { get; set; } = ""; public string Email { get; set; } = ""; public string Phone { get; set; } = ""; public string Message { get; set; } = ""; public string Subject { get; set; } = "General Consultation"; }

class Lead
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Subject { get; set; } = "";
    public string CompanyOrBookTitle { get; set; } = "";
    public string LinkedInUrl { get; set; } = "";
    public string ReferralPartnerCode { get; set; } = "";
    public string LandingPageVisited { get; set; } = "";
    public string Status { get; set; } = "new";
    public string PackageTier { get; set; } = "";
    public decimal? DealValueUsd { get; set; }
    public bool FundsCleared { get; set; } = false;
    public bool CommissionPaid { get; set; } = false;
    public decimal? CommissionAmountZar { get; set; }
    public DateTime? FormSubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[BsonIgnoreExtraElements]
class LiveStats 
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    [BsonRepresentation(BsonType.Double, AllowTruncation = true)]
    public decimal grossRevenue { get; set; } = 12845;
    public int websiteVisitors { get; set; } = 12845;
    public int packagesSold { get; set; } = 297;
    public int consultationsBooked { get; set; } = 185;
}

class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string Name { get; set; } = "";
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
    public string Role { get; set; } = "developer";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public bool IsTwoFactorEnabled { get; set; } = false;
    public string? TwoFactorSecret { get; set; }
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetExpiry { get; set; }
}

class InviteToken
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string Token { get; set; } = "";
    public string Role { get; set; } = "client";
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; } = false;
    public string CreatedBy { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

class ActivityLog
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string Type { get; set; } = ""; // sale, consultation
    public string Message { get; set; } = "";
    public decimal? Amount { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

[BsonIgnoreExtraElements]
class DailyStat
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string Date { get; set; } = "";
    public string Name { get; set; } = "";
    public int Sales { get; set; } = 0;
    public int Traffic { get; set; } = 0;
    [BsonRepresentation(BsonType.Double, AllowTruncation = true)]
    public decimal Revenue { get; set; } = 0;
}

class InviteRequest { public string Role { get; set; } = "client"; }
class SignupRequest { public string InviteToken { get; set; } = ""; public string Username { get; set; } = ""; public string Email { get; set; } = ""; public string Password { get; set; } = ""; public string Name { get; set; } = ""; }
class ForgotPasswordRequest { public string Email { get; set; } = ""; }
class ResetPasswordRequest { public string Token { get; set; } = ""; public string NewPassword { get; set; } = ""; }
class MfaLoginRequest { public string UserId { get; set; } = ""; public string Code { get; set; } = ""; }
class VerifyMfaRequest { public string Code { get; set; } = ""; }












class StatusUpdateRequest { public string Status { get; set; } = ""; }




