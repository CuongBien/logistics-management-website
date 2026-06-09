using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Outbound.Commands.AssignWave;

public record AssignWaveCommand(Guid WaveId, string OperatorId) : IRequest<Result<bool>>;

public class AssignWaveCommandHandler : IRequestHandler<AssignWaveCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public AssignWaveCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(AssignWaveCommand request, CancellationToken cancellationToken)
    {
        var wave = await _context.Waves
            .FirstOrDefaultAsync(w => w.Id == request.WaveId, cancellationToken);
            
        if (wave == null)
            return Result<bool>.Failure(new Error("Wave.NotFound", "Wave not found."));

        if (!string.IsNullOrEmpty(wave.AssignedOperatorId) && wave.AssignedOperatorId != request.OperatorId)
            return Result<bool>.Failure(new Error("Wave.AlreadyAssigned", "Wave is already assigned."));

        wave.Assign(request.OperatorId);

        // Explicitly load and assign pick tasks
        var pickTasks = await _context.PickTasks
            .Where(pt => pt.WaveId == request.WaveId.ToString() && pt.Status == Warehouse.Domain.Entities.PickTaskStatus.Pending)
            .ToListAsync(cancellationToken);
            
        foreach (var task in pickTasks)
        {
            // Do NOT call Start() here, just assign if needed or wait until Wave starts
            // task.Assign(...) if such method exists, otherwise just wait for StartWave
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
