using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Outbound.Commands.ReleaseWave;

public record ReleaseWaveCommand(Guid WaveId) : IRequest<Result<bool>>;

public sealed class ReleaseWaveCommandHandler : IRequestHandler<ReleaseWaveCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public ReleaseWaveCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(ReleaseWaveCommand request, CancellationToken cancellationToken)
    {
        var wave = await _context.Waves.FindAsync(new object[] { request.WaveId }, cancellationToken);
        if (wave == null)
            return Result<bool>.Failure(Error.NotFound("Wave.NotFound", "Wave not found"));

        _context.Waves.Remove(wave);
        
        // Remove associated pick tasks? For now we just remove the wave.
        var searchWaveId = wave.Id.ToString();
        var searchWaveNo = wave.WaveNo;
        var pickTasks = await _context.PickTasks.Where(pt => pt.WaveId == searchWaveId || pt.WaveId == searchWaveNo).ToListAsync(cancellationToken);
        foreach(var pt in pickTasks)
        {
            _context.PickTasks.Remove(pt);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
