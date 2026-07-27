using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace TWPublishers.Backend.Models
{
    // Outbox collection
    public class OutboxEvent
    {
        [BsonId]
        public ObjectId Id { get; set; }
        public string Topic { get; set; } = "form.submitted";
        public string PayloadJson { get; set; } = string.Empty; // JSON string
        public string IdempotencyKey { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ProcessedAt { get; set; } = null;
    }

    // Idempotency collection (replaces Redis)
    public class IdempotencyRecord
    {
        [BsonId]
        public ObjectId Id { get; set; }
        public string Key { get; set; } = string.Empty; // e.g., "form_email_{consultationId}"
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    // Dead Letter Queue archive
    public class DlqMessage
    {
        [BsonId]
        public ObjectId Id { get; set; }
        public string OriginalPayloadJson { get; set; } = string.Empty;
        public string Topic { get; set; } = string.Empty;
        public string FailureReason { get; set; } = string.Empty;
        public int AttemptCount { get; set; } = 0;
        public DateTime FailedAt { get; set; } = DateTime.UtcNow;
    }

    public class JobMessage
    {
        public Guid MessageId { get; set; } = Guid.NewGuid();
        public string OutboxEventId { get; set; } = string.Empty; // MongoDB _id as string
        public string PayloadJson { get; set; } = string.Empty;
        public string IdempotencyKey { get; set; } = string.Empty;
        public int AttemptCount { get; set; } = 0;
        public DateTime? VisibleAfter { get; set; } = null;
        public bool IsDeleted { get; set; } = false;
        public string TraceId { get; set; } = string.Empty;
    }
}
