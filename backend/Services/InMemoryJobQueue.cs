using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading;
using Microsoft.Extensions.Logging;
using TWPublishers.Backend.Models;
using MongoDB.Driver;

namespace TWPublishers.Backend.Services
{
    // PRODUCTION: Replace this entire class with Amazon SQS, Azure Service Bus, or RabbitMQ.
    // The worker and poller logic below remain identical regardless of transport.
    
    public interface IJobQueue
    {
        void Enqueue(JobMessage message);
        bool TryDequeue(out JobMessage? message);
        void DeleteMessage(Guid messageId);
        void IncrementAttempt(Guid messageId);
        void MoveToDlq(Guid messageId, string reason);
        void RequeueInvisibleMessages(); // Makes messages visible again after timeout
    }

    public class InMemoryJobQueue : IJobQueue
    {
        private readonly ConcurrentDictionary<Guid, JobMessage> _messages = new();
        private readonly ILogger<InMemoryJobQueue> _logger;
        private readonly IMongoCollection<DlqMessage> _dlqCollection;

        public InMemoryJobQueue(ILogger<InMemoryJobQueue> logger, IMongoClient mongoClient)
        {
            _logger = logger;
            var database = mongoClient.GetDatabase("TwPublisher");
            _dlqCollection = database.GetCollection<DlqMessage>("DlqArchive");
        }

        public void Enqueue(JobMessage message)
        {
            message.VisibleAfter = DateTime.UtcNow;
            _messages[message.MessageId] = message;
        }

        public bool TryDequeue(out JobMessage? message)
        {
            var now = DateTime.UtcNow;
            
            // Find first visible, non-deleted message
            var availableMessagePair = _messages.FirstOrDefault(kvp => 
                !kvp.Value.IsDeleted && 
                kvp.Value.VisibleAfter.HasValue && 
                kvp.Value.VisibleAfter.Value <= now);

            if (availableMessagePair.Key == Guid.Empty)
            {
                message = null;
                return false;
            }

            // Hide it for 30 seconds (visibility timeout)
            var job = availableMessagePair.Value;
            job.VisibleAfter = now.AddSeconds(30);
            message = job;
            return true;
        }

        public void DeleteMessage(Guid messageId)
        {
            if (_messages.TryGetValue(messageId, out var message))
            {
                message.IsDeleted = true;
                _messages.TryRemove(messageId, out _);
            }
        }

        public void IncrementAttempt(Guid messageId)
        {
            if (_messages.TryGetValue(messageId, out var message))
            {
                message.AttemptCount++;
            }
        }

        public void MoveToDlq(Guid messageId, string reason)
        {
            if (_messages.TryGetValue(messageId, out var message))
            {
                // Write to MongoDB DLQ collection
                var dlqDoc = new DlqMessage
                {
                    OriginalPayloadJson = message.PayloadJson,
                    Topic = "form.submitted",
                    FailureReason = reason,
                    AttemptCount = message.AttemptCount,
                    FailedAt = DateTime.UtcNow
                };
                
                _dlqCollection.InsertOne(dlqDoc);
                
                // Remove from queue permanently
                DeleteMessage(messageId);
            }
        }

        public void RequeueInvisibleMessages()
        {
            // Handled naturally by TryDequeue doing `VisibleAfter <= now`.
            // We could log if any messages reappeared.
            var now = DateTime.UtcNow;
            var reappearingCount = _messages.Count(kvp => !kvp.Value.IsDeleted && kvp.Value.VisibleAfter <= now && kvp.Value.AttemptCount > 0);
            if (reappearingCount > 0)
            {
                _logger.LogInformation("Requeued {Count} invisible messages for retry", reappearingCount);
            }
        }
    }
}
