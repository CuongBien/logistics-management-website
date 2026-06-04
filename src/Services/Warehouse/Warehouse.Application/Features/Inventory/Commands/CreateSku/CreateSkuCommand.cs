using MediatR;
using Microsoft.EntityFrameworkCore;
using Logistics.Core;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Inventory.Commands.CreateSku;

public record CreateSkuCommand(
    string SkuCode,
    string Name,
    string UnitOfMeasure,
    string Status
) : IRequest<Result<Guid>>
{
    public string? TenantId { get; set; }
}

public class CreateSkuCommandHandler : IRequestHandler<CreateSkuCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public CreateSkuCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(CreateSkuCommand request, CancellationToken cancellationToken)
    {
        var tenantId = string.IsNullOrEmpty(request.TenantId) ? "tenant-1" : request.TenantId;
        var existingSku = await _context.ErpSkuMirrors
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.SkuCode == request.SkuCode, cancellationToken);
            
        if (existingSku != null)
        {
            existingSku.ApplySync(
                request.Name,
                request.UnitOfMeasure,
                request.Status,
                DateTime.UtcNow,
                DateTime.UtcNow
            );
            _context.ErpSkuMirrors.Update(existingSku);
            await _context.SaveChangesAsync(cancellationToken);
            return Result<Guid>.Success(existingSku.Id);
        }

        var sku = ErpSkuMirror.Create(
            tenantId,
            $"erp-{request.SkuCode}",
            request.SkuCode,
            request.Name,
            request.UnitOfMeasure,
            request.Status,
            DateTime.UtcNow,
            DateTime.UtcNow
        );

        _context.ErpSkuMirrors.Add(sku);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(sku.Id);
    }
}
