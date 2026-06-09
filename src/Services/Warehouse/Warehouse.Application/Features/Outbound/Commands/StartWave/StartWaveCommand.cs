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

        var pickTasks = await _context.PickTasks
            .Where(pt => pt.WaveId == request.WaveId.ToString())
            .ToListAsync(cancellationToken);
            
        foreach (var task in pickTasks)
        {
            task.Start(wave.AssignedOperatorId ?? "");
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
