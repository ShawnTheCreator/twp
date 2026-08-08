using System;
using System.Threading.Tasks;
using MongoDB.Driver;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

class InviteToken
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string Token { get; set; } = "";
    public string Role { get; set; } = "client";
    public bool IsUsed { get; set; } = false;
    public string CreatedBy { get; set; } = "system";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
}

class Program 
{
    static async Task Main() 
    {
        var client = new MongoClient("mongodb+srv://ShawnMain:ShawnChareka123@cluster0.yxk9mo6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
        var db = client.GetDatabase("TwPublisher");
        var collection = db.GetCollection<InviteToken>("InviteTokens");

        var t1 = Guid.NewGuid().ToString("N");
        var t2 = Guid.NewGuid().ToString("N");
        
        await collection.InsertOneAsync(new InviteToken { Token = t1, Role = "admin", ExpiresAt = DateTime.UtcNow.AddDays(2) });
        await collection.InsertOneAsync(new InviteToken { Token = t2, Role = "client", ExpiresAt = DateTime.UtcNow.AddDays(2) });

        Console.WriteLine($"ADMIN_TOKEN={t1}");
        Console.WriteLine($"CLIENT_TOKEN={t2}");
    }
}
