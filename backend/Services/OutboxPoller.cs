using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using TWPublishers.Backend.Models;

namespace TWPublishers.Backend.Services
{
    public class OutboxPoller : BackgroundService
    {
        private readonly IJobQueue _jobQueue;
        private readonly ILogger<OutboxPoller> _logger;
        private readonly IMongoCollection<OutboxEvent> _outboxCollection;

        public OutboxPoller(IJobQueue jobQueue, ILogger<OutboxPoller> logger, IMongoClient mongoClient)
        {
            _jobQueue = jobQueue;
            _logger = logger;
            var database = mongoClient.GetDatabase("TwPublisher");
            _outboxCollection = database.GetCollection<OutboxEvent>("Outbox");
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            using var timer = new PeriodicTimer(TimeSpan.FromSeconds(1));

            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                try
                {
                    // Find unprocessed events
                    var unprocessed = await _outboxCollection
                        .Find(x => x.ProcessedAt == null)
                        .Limit(100)
                        .ToListAsync(stoppingToken);

                    foreach (var evt in unprocessed)
                    {
                        // Enqueue to the visibility queue
                        var traceId = Activity.Current?.Id ?? Guid.NewGuid().ToString();
                        
                        var jobMessage = new JobMessage
                        {
                            OutboxEventId = evt.Id.ToString(),
                            PayloadJson = evt.PayloadJson,
                            IdempotencyKey = evt.IdempotencyKey,
                            TraceId = traceId
                        };

                        _jobQueue.Enqueue(jobMessage);

                        // Update DB
                        var update = Builders<OutboxEvent>.Update.Set(x => x.ProcessedAt, DateTime.UtcNow);
                        await _outboxCollection.UpdateOneAsync(x => x.Id == evt.Id, update, cancellationToken: stoppingToken);

                        _logger.LogInformation("JobPublished: {OutboxEventId}, TraceId: {TraceId}", evt.Id, traceId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while polling outbox.");
                }
            }
        }
    }
}
