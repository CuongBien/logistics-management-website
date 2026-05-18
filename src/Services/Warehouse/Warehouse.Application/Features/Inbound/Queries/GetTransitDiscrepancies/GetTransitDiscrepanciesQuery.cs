using MediatR;
using Microsoft.EntityFrameworkCore;
using Logistics.Core;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Warehouse.Application.Features.Inbound.Queries.GetTransitDiscrepancies;

public record GetTransitDiscrepanciesQuery(
    Guid? WarehouseId = null,
    Guid? OrderId = null,
    Guid? ShipmentId = null,
    TransitDiscrepancyStatus? Status = null
) : IRequest<Result<List<TransitDiscrepancy>>>;

public class GetTransitDiscrepanciesQueryHandler : IRequestHandler<GetTransitDiscrepanciesQuery, Result<List<TransitDiscrepancy>>>
{
    private readonly IApplicationDbContext _context;

    public GetTransitDiscrepanciesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<TransitDiscrepancy>>> Handle(GetTransitDiscrepanciesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.TransitDiscrepancies.AsQueryable();

        if (request.WarehouseId.HasValue)
        {
            query = query.Where(x => x.WarehouseId == request.WarehouseId.Value);
        }

        if (request.OrderId.HasValue)
        {
            query = query.Where(x => x.OutboundOrderId == request.OrderId.Value);
        }

        if (request.ShipmentId.HasValue)
        {
            query = query.Where(x => x.ShipmentId == request.ShipmentId.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(x => x.Status == request.Status.Value);
        }

        var results = await query.OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);
        return Result<List<TransitDiscrepancy>>.Success(results);
    }
}
