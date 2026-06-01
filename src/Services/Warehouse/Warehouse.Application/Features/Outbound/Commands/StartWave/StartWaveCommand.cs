using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Outbound.Commands.StartWave;

public record StartWaveCommand(Guid WaveId) : IRequest<Result<bool>>;

public sealed class StartWaveCommandHandler : IRequestHandler<StartWaveCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public StartWaveCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(StartWaveCommand request, CancellationToken cancellationToken)
    {
        var wave = await _context.Waves.FindAsync(new object[] { request.WaveId }, cancellationToken);
        if (wave == null)
            return Result<bool>.Failure(Error.NotFound("Wave.NotFound", "Wave not found"));

        wave.StartPicking();

        // Update pick tasks to InProgress or keep them Pending but wave is Picking
        // For now just starting wave is enough

        await _context.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
