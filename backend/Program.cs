using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Net;
using System.Net.Mail;
using System.Text.Json;
using TWPublishers.Backend.Models;
using TWPublishers.Backend.Services;

// Load .env file if it exists (useful for local development)
DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();

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
              .AllowCredentials(); // REQUIRED for receiving cross-origin cookies like twp_ref
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
builder.Services.AddHostedService<OutboxPoller>();
builder.Services.AddHostedService<JobWorker>();
builder.Services.AddHostedService<CommissionService>();

var database = client.GetDatabase("TwPublisher");

var statsCollection = database.GetCollection<LiveStats>("Stats");
var leadsCollection = database.GetCollection<Lead>("Leads");
var usersCollection = database.GetCollection<User>("Users");
var activitiesCollection = database.GetCollection<ActivityLog>("Activities");
var dailyStatsCollection = database.GetCollection<DailyStat>("DailyStats");
var outboxCollection = database.GetCollection<OutboxEvent>("Outbox");
var idempotencyCollection = database.GetCollection<IdempotencyRecord>("Idempotency");
var referralPartnersCollection = database.GetCollection<ReferralPartner>("ReferralPartners");
var commissionTiersCollection = database.GetCollection<CommissionTier>("CommissionTiers");
var commissionsCollection = database.GetCollection<Commission>("Commissions");
var auditLogsCollection = database.GetCollection<AuditLog>("AuditLogs");

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
    usersCollection.InsertOne(new User { Username = "admin", Password = "password123", Role = "admin", Name = "Webster Tsenase" });
    usersCollection.InsertOne(new User { Username = "dev", Password = "dev123", Role = "developer", Name = "Lead Developer" });
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

// 1. Stats Endpoint
app.MapGet("/api/stats", async () => 
{
    var stats = await statsCollection.Find(FilterDefinition<LiveStats>.Empty).FirstOrDefaultAsync();
    var chartData = await dailyStatsCollection.Find(FilterDefinition<DailyStat>.Empty).SortBy(d => d.Date).Limit(7).ToListAsync();
    
    return Results.Ok(new {
        grossRevenue = stats.grossRevenue,
        websiteVisitors = stats.websiteVisitors,
        packagesSold = stats.packagesSold,
        consultationsBooked = stats.consultationsBooked,
        chartData = chartData
    });
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
app.MapPost("/api/auth/login", async ([FromBody] LoginRequest req) =>
{
    var user = await usersCollection.Find(u => u.Username == req.Username && u.Password == req.Password).FirstOrDefaultAsync();
    if (user != null)
    {
        return Results.Ok(new { success = true, role = user.Role, name = user.Name, token = "fake-jwt-token" });
    }
    return Results.Unauthorized();
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
app.MapGet("/api/consultations", async () =>
{
    var leads = await leadsCollection.Find(FilterDefinition<Lead>.Empty).SortByDescending(c => c.CreatedAt).Limit(50).ToListAsync();
    return Results.Ok(leads);
});

// 7. GET Activities
app.MapGet("/api/activity", async () =>
{
    var activities = await activitiesCollection.Find(FilterDefinition<ActivityLog>.Empty).SortByDescending(a => a.Timestamp).Limit(50).ToListAsync();
    return Results.Ok(activities);
});

// 8. User Management
app.MapGet("/api/users", async () =>
{
    var users = await usersCollection.Find(FilterDefinition<User>.Empty).SortByDescending(u => u.CreatedAt).ToListAsync();
    return Results.Ok(users.Select(u => new { u.Id, u.Username, u.Name, u.Role, u.CreatedAt }));
});

app.MapPost("/api/users", async ([FromBody] User newUser) =>
{
    // Check if exists
    var existing = await usersCollection.Find(u => u.Username == newUser.Username).FirstOrDefaultAsync();
    if (existing != null) return Results.BadRequest("Username already exists");
    
    await usersCollection.InsertOneAsync(newUser);
    return Results.Ok(new { success = true });
});

app.MapDelete("/api/users/{id}", async (string id) =>
{
    await usersCollection.DeleteOneAsync(u => u.Id == id);
    return Results.Ok(new { success = true });
});

// 9. Referral Dashboard
app.MapGet("/api/admin/referrals/dashboard", async () =>
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
app.Run();

// Email logic moved to SmtpEmailService and JobWorker

// Models
class LoginRequest { public string Username { get; set; } = ""; public string Password { get; set; } = ""; }

class ConsultationRequest { public string Name { get; set; } = ""; public string Email { get; set; } = ""; public string Phone { get; set; } = ""; public string Message { get; set; } = ""; public string Subject { get; set; } = "General Consultation"; }

class Lead
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
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

class LiveStats 
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public decimal grossRevenue { get; set; } = 1245000;
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
    public string Password { get; set; } = "";
    public string Role { get; set; } = "developer";
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

class DailyStat
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string Date { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-dd");
    public string Name { get; set; } = DateTime.UtcNow.ToString("ddd");
    public int Sales { get; set; } = 0;
    public int Traffic { get; set; } = 0;
    public decimal Revenue { get; set; } = 0;
}
