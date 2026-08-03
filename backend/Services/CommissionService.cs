using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using TWPublishers.Backend.Models;

namespace TWPublishers.Backend.Services
{
    public class CommissionService : BackgroundService
    {
        private readonly ILogger<CommissionService> _logger;
        private readonly IMongoClient _mongoClient;
        private readonly HttpClient _httpClient;
        private IMongoCollection<Lead> _leadsCollection;
        private IMongoCollection<Commission> _commissionsCollection;
        private IMongoCollection<CommissionTier> _commissionTiersCollection;
        private IMongoCollection<ReferralPartner> _partnersCollection;
        private IMongoCollection<AuditLog> _auditLogsCollection;

        public CommissionService(ILogger<CommissionService> logger, IMongoClient mongoClient)
        {
            _logger = logger;
            _mongoClient = mongoClient;
            _httpClient = new HttpClient();
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var database = _mongoClient.GetDatabase("TwPublisher");
            _leadsCollection = database.GetCollection<Lead>("Leads");
            _commissionsCollection = database.GetCollection<Commission>("Commissions");
            _commissionTiersCollection = database.GetCollection<CommissionTier>("CommissionTiers");
            _partnersCollection = database.GetCollection<ReferralPartner>("ReferralPartners");
            _auditLogsCollection = database.GetCollection<AuditLog>("AuditLogs");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessCommissionsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing commissions");
                }
                
                // Poll every 1 minute
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }

        private async Task ProcessCommissionsAsync(CancellationToken stoppingToken)
        {
            // Find leads that are closed_won, funds_cleared, have a partner code, but commission hasn't been paid/calculated yet.
            var leadsToProcess = await _leadsCollection.Find(
                l => l.Status == "closed_won" && 
                     l.FundsCleared == true && 
                     l.CommissionPaid == false && 
                     l.ReferralPartnerCode != ""
            ).ToListAsync(stoppingToken);

            foreach (var lead in leadsToProcess)
            {
                // Check if a commission record already exists for this lead to prevent duplicates
                var existingCommission = await _commissionsCollection.Find(c => c.LeadId == lead.Id).FirstOrDefaultAsync(stoppingToken);
                if (existingCommission != null) continue;

                var partner = await _partnersCollection.Find(p => p.PartnerCode == lead.ReferralPartnerCode).FirstOrDefaultAsync(stoppingToken);
                if (partner == null)
                {
                    _logger.LogWarning($"Partner {lead.ReferralPartnerCode} not found for Lead {lead.Id}. Skipping commission.");
                    continue;
                }

                // Verify the partner wasn't terminated BEFORE this lead submitted the form
                if (partner.Status == "terminated" && partner.TerminatedAt.HasValue)
                {
                    if (lead.FormSubmittedAt > partner.TerminatedAt.Value)
                    {
                        _logger.LogWarning($"Partner {partner.PartnerCode} was terminated before Lead {lead.Id} was submitted. No commission earned.");
                        continue;
                    }
                }

                var tier = await _commissionTiersCollection.Find(t => t.TierName == lead.PackageTier).FirstOrDefaultAsync(stoppingToken);
                if (tier == null)
                {
                    _logger.LogWarning($"Commission Tier '{lead.PackageTier}' not found for Lead {lead.Id}. Cannot calculate commission.");
                    continue;
                }

                // 1. Get Live Exchange Rate
                decimal exchangeRate = 18.0m; // Fallback
                try 
                {
                    var response = await _httpClient.GetAsync("https://api.exchangerate-api.com/v4/latest/USD", stoppingToken);
                    if (response.IsSuccessStatusCode)
                    {
                        var json = await response.Content.ReadAsStringAsync(stoppingToken);
                        var doc = JsonDocument.Parse(json);
                        exchangeRate = doc.RootElement.GetProperty("rates").GetProperty("ZAR").GetDecimal();
                    }
                } 
                catch (Exception ex)
                {
                    _logger.LogError($"Failed to fetch exchange rate: {ex.Message}");
                }

                // 2. Create Commission Record
                decimal commissionZar = Math.Round(tier.CommissionUsd * exchangeRate, 2);
                
                var commission = new Commission
                {
                    LeadId = lead.Id ?? "",
                    PartnerCode = partner.PartnerCode,
                    PackageTier = tier.TierName,
                    CommissionUsd = tier.CommissionUsd,
                    ExchangeRate = exchangeRate,
                    CommissionZar = commissionZar,
                    ExchangeRateSource = "https://api.exchangerate-api.com/v4/latest/USD",
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow
                };

                using var session = await _mongoClient.StartSessionAsync();
                session.StartTransaction();
                try
                {
                    await _commissionsCollection.InsertOneAsync(session, commission, cancellationToken: stoppingToken);
                    
                    var update = Builders<Lead>.Update.Set(l => l.CommissionAmountZar, commissionZar);
                    await _leadsCollection.UpdateOneAsync(session, l => l.Id == lead.Id, update, cancellationToken: stoppingToken);
                    
                    var audit = new AuditLog
                    {
                        EntityType = "Commission",
                        EntityId = commission.Id ?? "",
                        Action = "commission_calculated",
                        PerformedBy = "system",
                        Details = JsonSerializer.Serialize(new { 
                            leadId = lead.Id, 
                            usd = commission.CommissionUsd, 
                            rate = commission.ExchangeRate, 
                            zar = commission.CommissionZar 
                        })
                    };
                    await _auditLogsCollection.InsertOneAsync(session, audit, cancellationToken: stoppingToken);

                    await session.CommitTransactionAsync(stoppingToken);
                    _logger.LogInformation($"Commission created for Lead {lead.Id}. Partner: {partner.PartnerCode}. ZAR: {commissionZar}");
                }
                catch (Exception ex)
                {
                    await session.AbortTransactionAsync(stoppingToken);
                    _logger.LogError($"Failed to commit commission for Lead {lead.Id}: {ex.Message}");
                }
            }
        }
    }
}
