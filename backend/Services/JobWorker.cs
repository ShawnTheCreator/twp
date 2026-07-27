using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using TWPublishers.Backend.Models;

namespace TWPublishers.Backend.Services
{
    public class JobWorker : BackgroundService
    {
        private readonly IJobQueue _jobQueue;
        private readonly IEmailService _emailService;
        private readonly ILogger<JobWorker> _logger;
        private readonly IMongoCollection<IdempotencyRecord> _idempotencyCollection;

        public JobWorker(
            IJobQueue jobQueue, 
            IEmailService emailService, 
            ILogger<JobWorker> logger, 
            IMongoClient mongoClient)
        {
            _jobQueue = jobQueue;
            _emailService = emailService;
            _logger = logger;
            var database = mongoClient.GetDatabase("TwPublisher");
            _idempotencyCollection = database.GetCollection<IdempotencyRecord>("Idempotency");
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Spawn 3 parallel consumers
            var consumers = new[]
            {
                ConsumeLoop(stoppingToken),
                ConsumeLoop(stoppingToken),
                ConsumeLoop(stoppingToken),
                RequeueLoop(stoppingToken) // Requeues invisible messages
            };

            await Task.WhenAll(consumers);
        }

        private async Task RequeueLoop(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                _jobQueue.RequeueInvisibleMessages();
                await Task.Delay(5000, stoppingToken);
            }
        }

        private async Task ConsumeLoop(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                JobMessage? message = null;
                try
                {
                    if (!_jobQueue.TryDequeue(out message) || message == null)
                    {
                        await Task.Delay(500, stoppingToken);
                        continue;
                    }

                    _logger.LogInformation("JobReceived: {MessageId}, Key: {IdempotencyKey}", message.MessageId, message.IdempotencyKey);

                    // Idempotency check
                    var existingRecord = await _idempotencyCollection.Find(x => x.Key == message.IdempotencyKey).FirstOrDefaultAsync(stoppingToken);
                    if (existingRecord != null)
                    {
                        _logger.LogInformation("DuplicateDetected: {IdempotencyKey}, skipping", message.IdempotencyKey);
                        _jobQueue.DeleteMessage(message.MessageId);
                        continue;
                    }

                    // Process Payload
                    var payload = JsonSerializer.Deserialize<JsonElement>(message.PayloadJson);
                    var name = payload.GetProperty("name").GetString();
                    var email = payload.GetProperty("email").GetString();
                    var userMessage = payload.GetProperty("message").GetString();

                    // Send Emails
                    var adminHtml = $@"
                        <h3>New Consultation Received</h3>
                        <table border='1' cellpadding='5'>
                            <tr><td>Name</td><td>{name}</td></tr>
                            <tr><td>Email</td><td>{email}</td></tr>
                            <tr><td>Message</td><td>{userMessage}</td></tr>
                        </table>";
                        
                    var userHtml = $@"
                        <h3>We Received Your Message</h3>
                        <p>Hi {name},</p>
                        <p>Thank you for reaching out to TW Publishers. We received your message:</p>
                        <blockquote>{userMessage}</blockquote>
                        <p>We will get back to you shortly!</p>";

                    await _emailService.SendEmailAsync("hello@twpublishers.co.za", "New Consultation Received", adminHtml, message.TraceId, stoppingToken);
                    await _emailService.SendEmailAsync(email ?? "", "We Received Your Message", userHtml, message.TraceId, stoppingToken);

                    // If we reach here, BOTH emails succeeded.
                    
                    // 1. Insert Idempotency Key (Handle Race Conditions with Upsert)
                    var updateOptions = new UpdateOptions { IsUpsert = true };
                    var update = Builders<IdempotencyRecord>.Update
                        .SetOnInsert(x => x.Key, message.IdempotencyKey)
                        .SetOnInsert(x => x.CreatedAt, DateTime.UtcNow);
                        
                    await _idempotencyCollection.UpdateOneAsync(
                        x => x.Key == message.IdempotencyKey, 
                        update, 
                        updateOptions, 
                        stoppingToken);

                    // 2. Delete from Queue
                    _jobQueue.DeleteMessage(message.MessageId);
                }
                catch (Exception ex)
                {
                    if (ex is TaskCanceledException) return;

                    if (message != null)
                    {
                        _jobQueue.IncrementAttempt(message.MessageId);
                        message.AttemptCount++; // Local increment for logic

                        _logger.LogError("JobFailed: {MessageId}, Attempt: {AttemptCount}, Error: {Error}", message.MessageId, message.AttemptCount, ex.Message);

                        if (message.AttemptCount >= 5)
                        {
                            var reason = $"{ex.Message} | Attempts: {message.AttemptCount}";
                            _logger.LogWarning("JobMovedToDlq: {MessageId}, Reason: {Reason}", message.MessageId, reason);
                            _jobQueue.MoveToDlq(message.MessageId, reason);
                        }
                    }
                }
            }
        }
    }
}
