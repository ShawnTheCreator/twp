using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

var builder = WebApplication.CreateBuilder(args);

// Add CORS to allow the Next.js frontend to communicate with this backend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Setup MongoDB connection
var connectionString = "mongodb+srv://ShawnMain:ShawnChareka123@cluster0.yxk9mo6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
var client = new MongoClient(connectionString);
var database = client.GetDatabase("TwPublisher");
var statsCollection = database.GetCollection<LiveStats>("Stats");

// Ensure the collection has a document
if (statsCollection.CountDocuments(FilterDefinition<LiveStats>.Empty) == 0)
{
    statsCollection.InsertOne(new LiveStats());
}

var app = builder.Build();

app.UseCors("AllowFrontend");

// 1. Endpoint to get stats for the dashboard
app.MapGet("/api/stats", async () => 
{
    var stats = await statsCollection.Find(FilterDefinition<LiveStats>.Empty).FirstOrDefaultAsync();
    return Results.Ok(stats);
});

// 2. Payfast Webhook Endpoint
app.MapPost("/api/payfast/webhook", async (HttpRequest request) =>
{
    var form = await request.ReadFormAsync();
    var paymentStatus = form["payment_status"];
    var amountGross = form["amount_gross"];
    var mPaymentId = form["m_payment_id"];

    if (paymentStatus == "COMPLETE")
    {
        var incrementAmount = decimal.TryParse(amountGross, out var amount) ? amount : 2000m;
        var update = Builders<LiveStats>.Update
            .Inc(s => s.packagesSold, 1)
            .Inc(s => s.grossRevenue, incrementAmount);
            
        await statsCollection.UpdateOneAsync(FilterDefinition<LiveStats>.Empty, update);
        
        Console.WriteLine($"[WEBHOOK] Received valid Payfast payment of R{amountGross}");
        return Results.Ok();
    }
    return Results.BadRequest("Payment not complete.");
});

// 3. Simple Login Endpoint
app.MapPost("/api/auth/login", ([FromBody] LoginRequest req) =>
{
    if ((req.Username == "admin" && req.Password == "password123") || 
        (req.Username == "dev" && req.Password == "dev123"))
    {
        return Results.Ok(new { success = true, role = req.Username == "admin" ? "admin" : "developer", token = "fake-jwt-token" });
    }
    return Results.Unauthorized();
});

// 4. Tracking Endpoint for the public site
app.MapPost("/api/track/visitor", async () =>
{
    var update = Builders<LiveStats>.Update.Inc(s => s.websiteVisitors, 1);
    await statsCollection.UpdateOneAsync(FilterDefinition<LiveStats>.Empty, update);
    Console.WriteLine($"[TRACKING] New visitor recorded in MongoDB.");
    return Results.Ok(new { success = true });
});

app.Run();

class LoginRequest { public string Username { get; set; } = ""; public string Password { get; set; } = ""; }

class LiveStats 
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public decimal grossRevenue { get; set; } = 1245000;
    public int websiteVisitors { get; set; } = 12845;
    public int packagesSold { get; set; } = 297;
    public int consultationsBooked { get; set; } = 185;
    public object[] chartData { get; set; } = new[]
    {
        new { name = "Mon", sales = 42, traffic = 2400, revenue = 210000 },
        new { name = "Tue", sales = 30, traffic = 1398, revenue = 150000 },
        new { name = "Wed", sales = 58, traffic = 9800, revenue = 290000 },
        new { name = "Thu", sales = 38, traffic = 3908, revenue = 190000 },
        new { name = "Fri", sales = 48, traffic = 4800, revenue = 240000 },
        new { name = "Sat", sales = 38, traffic = 3800, revenue = 190000 },
        new { name = "Sun", sales = 43, traffic = 4300, revenue = 215000 }
    };
}
