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
            var scriptUrl = "https://script.google.com/macros/s/AKfycbwLNQ_Obw5mqYGfKFc5fdfQTxh9mdLBqHA2MohlFxUSIafimHy6Q0JxlBpLou4ufka6/exec";

            var payload = new
            {
                to = to,
                subject = subject,
                html = htmlBody
            };

            var jsonPayload = JsonSerializer.Serialize(payload);
            using var request = new HttpRequestMessage(HttpMethod.Post, scriptUrl);
            request.Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request, ct);
            var responseText = await response.Content.ReadAsStringAsync(ct);

            // Google Apps Script usually returns 200 OK and a JSON object for success/error
            if (response.IsSuccessStatusCode && responseText.Contains("\"status\":\"success\""))
            {
                _logger.LogInformation("EmailSent: {To}, Subject: {Subject}, TraceId: {TraceId}", to, subject, traceId);
            }
            else
            {
                _logger.LogError("Failed to send email via Google Apps Script. Status: {StatusCode}, Response: {Response}", response.StatusCode, responseText);
                throw new InvalidOperationException($"Google Apps Script Email failed: {responseText}");
            }
        }
    }
}
