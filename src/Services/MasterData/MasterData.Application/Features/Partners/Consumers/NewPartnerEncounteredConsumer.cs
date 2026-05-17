using EventBus.Messages.Events;
using MassTransit;
using MasterData.Application.Common.Interfaces;
using MasterData.Domain.Entities;
using MasterData.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MasterData.Application.Features.Partners.Consumers;

public class NewPartnerEncounteredConsumer : IConsumer<NewPartnerEncounteredIntegrationEvent>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<NewPartnerEncounteredConsumer> _logger;

    public NewPartnerEncounteredConsumer(IApplicationDbContext context, ILogger<NewPartnerEncounteredConsumer> logger)
    {
        _context = context;
        _logger = logger;
        _logger.LogInformation("NewPartnerEncounteredConsumer initialized.");
    }

    public async Task Consume(ConsumeContext<NewPartnerEncounteredIntegrationEvent> context)
    {
        var msg = context.Message;
        _logger.LogInformation("Processing NewPartnerEncountered event for Tenant: {TenantId}, Phone: {Phone}", msg.TenantId, msg.Phone);

        // Logic: Upsert partner based on TenantId + Phone
        var partner = await _context.Partners
            .FirstOrDefaultAsync(x => x.TenantId == msg.TenantId && x.Phone == msg.Phone);

        if (partner == null)
        {
            _logger.LogInformation("Creating new partner in master data for tenant {TenantId}", msg.TenantId);
            partner = new Partner(
                msg.TenantId,
                $"CONT-{DateTime.UtcNow:yyMMddHHmmss}",
                msg.Name,
                PartnerType.Consignee,
                msg.Phone,
                msg.Address,
                msg.City,
                msg.Latitude,
                msg.Longitude
            );
            _context.Partners.Add(partner);
        }
        else
        {
            _logger.LogInformation("Updating existing partner {PartnerId} in master data", partner.Id);
            partner.UpdateInfo(msg.Name, msg.Phone, msg.Address, msg.City, msg.Latitude, msg.Longitude);
        }

        await _context.SaveChangesAsync(context.CancellationToken);
    }
}
