using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Outbound.Queries.GetWavesList;

public record WaveDto(string Id, string WaveNo, string Type, int OrderCount, string Status, string? AssignedTo, DateTime CreatedAt);

public record GetWavesListQuery(Guid WarehouseId) : IRequest<Result<List<WaveDto>>>;

public sealed class GetWavesListQueryHandler : IRequestHandler<GetWavesListQuery, Result<List<WaveDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetWavesListQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<WaveDto>>> Handle(GetWavesListQuery request, CancellationToken cancellationToken)
    {
        var waves = await _context.Waves
            .Where(w => w.WarehouseId == request.WarehouseId)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync(cancellationToken);

        var dtos = waves.Select(w => new WaveDto(
            w.Id.ToString(),
            w.WaveNo,
            w.Type == WaveType.SingleItem ? "Single-Item" : "Multi-Item",
            w.OrderCount,
            w.Status.ToString(),
            w.AssignedOperatorId,
            w.CreatedAt
        )).ToList();

        return Result<List<WaveDto>>.Success(dtos);
    }
}
