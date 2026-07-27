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
                        await Task.Delay(50, stoppingToken);
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
                    var subject = payload.TryGetProperty("subject", out var subjectProp) ? subjectProp.GetString() : "General Consultation";
                    var phone = payload.TryGetProperty("phone", out var phoneProp) ? phoneProp.GetString() : "Not provided";

                    // Send Emails
                    var adminHtml = $@"
                    <div style=""font-family: 'Inter', Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px; border-radius: 16px;"">
                        <div style=""background-color: #ffffff; padding: 40px; border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;"">
                            <h2 style=""color: #1a4f8b; margin-top: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;"">New Consultation <span style=""color: #60a5fa;"">Request</span></h2>
                            <p style=""color: #64748b; font-size: 15px; margin-bottom: 30px;"">A new user has submitted the consultation form.</p>
                            
                            <table style=""width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 20px;"">
                                <tr>
                                    <td style=""padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; width: 100px;"">Name</td>
                                    <td style=""padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 500;"">{name}</td>
                                </tr>
                                <tr>
                                    <td style=""padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;"">Email</td>
                                    <td style=""padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #3b82f6; font-weight: 500;""><a href=""mailto:{email}"" style=""color: #3b82f6; text-decoration: none;"">{email}</a></td>
                                </tr>
                                <tr>
                                    <td style=""padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;"">Phone</td>
                                    <td style=""padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 500;"">{phone}</td>
                                </tr>
                                <tr>
                                    <td style=""padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;"">Subject</td>
                                    <td style=""padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 500;"">{subject}</td>
                                </tr>
                            </table>
                            
                            <div style=""margin-top: 20px;"">
                                <span style=""display: block; color: #94a3b8; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;"">Message</span>
                                <div style=""background-color: #f8fafc; padding: 20px; border-radius: 12px; color: #334155; line-height: 1.6; border: 1px solid #e2e8f0;"">
                                    {userMessage?.Replace("\n", "<br/>")}
                                </div>
                            </div>
                        </div>
                    </div>";
                        
                    var userHtml = $@"
                    <div style=""font-family: 'Inter', Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px; border-radius: 16px;"">
                        <div style=""background-color: #ffffff; padding: 40px; border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; text-align: center;"">
                            <h2 style=""color: #1a4f8b; margin-top: 0; font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;"">REQUEST <span style=""color: #60a5fa;"">RECEIVED</span></h2>
                            
                            <div style=""width: 64px; height: 64px; background-color: #dbeafe; border-radius: 50%; margin: 30px auto; display: flex; align-items: center; justify-content: center;"">
                                <span style=""color: #3b82f6; font-size: 32px;"">✓</span>
                            </div>

                            <p style=""color: #0f172a; font-size: 18px; font-weight: 600; margin-bottom: 10px;"">Hi {name},</p>
                            <p style=""color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;"">Thank you for reaching out to TW Publishers regarding <strong>{subject}</strong>. We've received your consultation request and our team is currently reviewing your details. We will get back to you shortly!</p>
                            
                            <div style=""background-color: #f8fafc; padding: 20px; border-radius: 12px; text-align: left; border: 1px solid #e2e8f0;"">
                                <span style=""display: block; color: #94a3b8; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;"">Your Message</span>
                                <p style=""color: #334155; line-height: 1.6; margin: 0; font-style: italic;"">""{userMessage?.Replace("\n", "<br/>")}""</p>
                            </div>

                            <div style=""margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 14px;"">
                                © {DateTime.UtcNow.Year} TW Publishers. All rights reserved.
                            </div>
                        </div>
                    </div>";

                    var adminEmails = Environment.GetEnvironmentVariable("ADMIN_EMAILS") ?? "hello@twpublishers.co.za, shawnchareka7@gmail.com";
                    await _emailService.SendEmailAsync(adminEmails, "New Consultation Received - TW Publishers", adminHtml, message.TraceId, stoppingToken);
                    await _emailService.SendEmailAsync(email ?? "", "We Received Your Message - TW Publishers", userHtml, message.TraceId, stoppingToken);

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
