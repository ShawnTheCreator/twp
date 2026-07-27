using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace TWPublishers.Backend.Services
{
    public class HttpEmailService : IEmailService
    {
        private readonly ILogger<HttpEmailService> _logger;
        private readonly HttpClient _httpClient;

        public HttpEmailService(ILogger<HttpEmailService> logger)
        {
            _logger = logger;
            _httpClient = new HttpClient();
        }

        public async Task SendEmailAsync(string to, string subject, string htmlBody, string traceId, CancellationToken ct = default)
        {
            var apiKey = Environment.GetEnvironmentVariable("RESEND_API_KEY");
            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogWarning("RESEND_API_KEY not configured. Simulating success. TraceId: {TraceId}", traceId);
                return;
            }

            var fromEmail = Environment.GetEnvironmentVariable("SMTP_USER") ?? "hello@twpublishers.co.za";
            
            var emails = to.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            var payload = new
            {
                from = $"TW Publishers <{fromEmail}>",
                to = emails,
                subject = subject,
                html = htmlBody
            };

            var jsonPayload = JsonSerializer.Serialize(payload);
            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request, ct);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("EmailSent: {To}, Subject: {Subject}, TraceId: {TraceId}", to, subject, traceId);
            }
            else
            {
                var error = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("Failed to send email via HTTP API. Status: {StatusCode}, Error: {Error}", response.StatusCode, error);
                throw new InvalidOperationException($"HTTP API Email failed: {error}");
            }
        }
    }
}
