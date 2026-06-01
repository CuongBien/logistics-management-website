using System.Threading;
using System.Threading.Tasks;
using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Identity.Commands.UnassignRole;

public class UnassignRoleHandler : IRequestHandler<UnassignRoleCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public UnassignRoleHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(UnassignRoleCommand request, CancellationToken cancellationToken)
    {
        var assignment = await _context.OperatorRoleAssignments
            .FirstOrDefaultAsync(x => x.Id == request.AssignmentId, cancellationToken);

        if (assignment == null)
        {
            return Result<bool>.Failure(new Error(
                "RoleAssignment.NotFound", 
                $"Role assignment with ID '{request.AssignmentId}' not found."));
        }

        // Xóa hẳn bản ghi gán vai trò khỏi database
        _context.OperatorRoleAssignments.Remove(assignment);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
