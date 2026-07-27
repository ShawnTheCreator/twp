using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace TWPublishers.Backend.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string htmlBody, string traceId, CancellationToken ct = default);
    }

    public class SmtpEmailService : IEmailService
    {
        private readonly ILogger<SmtpEmailService> _logger;

        public SmtpEmailService(ILogger<SmtpEmailService> logger)
        {
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string htmlBody, string traceId, CancellationToken ct = default)
        {
            var smtpHost = Environment.GetEnvironmentVariable("SMTP_HOST");
            var smtpPortStr = Environment.GetEnvironmentVariable("SMTP_PORT");
            var smtpUser = Environment.GetEnvironmentVariable("SMTP_USER");
            var smtpPass = Environment.GetEnvironmentVariable("SMTP_PASS");

            if (string.IsNullOrEmpty(smtpHost) || string.IsNullOrEmpty(smtpUser) || string.IsNullOrEmpty(smtpPass))
            {
                _logger.LogWarning("SMTP credentials not fully configured. Simulating success. TraceId: {TraceId}", traceId);
                return;
            }

            int smtpPort = int.TryParse(smtpPortStr, out var port) ? port : 587;
            
            // Render blocks port 587 and 25. Fallback to 465 (Implicit SSL) for Gmail bypass
            if (smtpPort == 587) 
            {
                smtpPort = 465;
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("TW Publishers System", smtpUser));
            
            // Support comma separated lists
            var emails = to.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach(var email in emails)
            {
                message.To.Add(new MailboxAddress("", email));
            }
            
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = htmlBody
            };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            
            // For Render, we need a custom timeout to fail fast if blocked
            client.Timeout = 10000; // 10 seconds
            
            // Connect using Implicit SSL on port 465
            await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.SslOnConnect, ct);
            await client.AuthenticateAsync(smtpUser, smtpPass, ct);
            await client.SendAsync(message, ct);
            await client.DisconnectAsync(true, ct);

            _logger.LogInformation("EmailSent: {To}, Subject: {Subject}, TraceId: {TraceId}", to, subject, traceId);
        }
    }
}
