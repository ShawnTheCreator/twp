using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace TWPublishers.Backend.Models
{
    public class RefreshToken
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
        public string UserId { get; set; } = "";
        public string Token { get; set; } = "";           // opaque 256-bit random
        public DateTime Expires { get; set; }
        public bool IsRevoked { get; set; }
        public string CreatedByIp { get; set; } = "";
        public string CreatedByUserAgent { get; set; } = "";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? RevokedAt { get; set; }
        public string ReplacedByToken { get; set; } = "";     // for rotation chain
    }
}
