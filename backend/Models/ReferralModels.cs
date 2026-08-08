using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace TWPublishers.Backend.Models
{
    // CommissionTier.cs
    public class CommissionTier
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
        public string TierName { get; set; } = "";        // "Origin", "Book Launch", "Elevate", "Authority", "Empire"
        public decimal CommissionUsd { get; set; }  // 15, 15, 100, 180, 400
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    // ReferralPartner.cs
    public class ReferralPartner
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
        public string PartnerName { get; set; } = "";
        public string PartnerCode { get; set; } = "";      // unique index
        public string ContactEmail { get; set; } = "";
        public string ContactPhone { get; set; } = "";
        public string Status { get; set; } = "active"; // active / idle / stalled / suspended / terminated
        public int CurrentStreak { get; set; } = 0;
        public DateTime? LastActivityAt { get; set; }
        public DateTime? TerminatedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class PartnerActivity
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
        public string PartnerCode { get; set; } = "";
        public DateTime Date { get; set; } = DateTime.UtcNow.Date;
        public int MessagesSent { get; set; }
        public int LinkClicks { get; set; }
        public int FormFills { get; set; }
        public int FollowUps { get; set; }
        public int Disqualified { get; set; }
        public bool HitMinimum { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    // Commission.cs
    public class Commission
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
        public string LeadId { get; set; } = "";
        public string PartnerCode { get; set; } = "";
        public string PackageTier { get; set; } = "";
        public decimal CommissionUsd { get; set; }
        public decimal ExchangeRate { get; set; }
        public decimal CommissionZar { get; set; }
        public string ExchangeRateSource { get; set; } = "";
        public string Status { get; set; } = "pending"; // pending / paid / offset
        public DateTime? PaidAt { get; set; }
        public string RemittanceAdviceUrl { get; set; } = ""; // link to generated PDF/text
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class AuditLog
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
        public string EntityType { get; set; } = "";      // "Lead", "Commission", "ReferralPartner"
        public string EntityId { get; set; } = "";
        public string UserId { get; set; } = "";          // Used for Auth
        public string Action { get; set; } = "";          // "created", "status_changed", "commission_calculated", "login_success"
        public string PerformedBy { get; set; } = "";     // "system", "shawn_chareka", etc.
        public string Details { get; set; } = "";         // JSON blob of what changed
        public string IpAddress { get; set; } = "";       // Used for Auth
        public string UserAgent { get; set; } = "";       // Used for Auth
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class OutreachScript
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
        public string Title { get; set; } = "";
        public string Platform { get; set; } = ""; // Email, LinkedIn, WhatsApp
        public string Content { get; set; } = "";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

