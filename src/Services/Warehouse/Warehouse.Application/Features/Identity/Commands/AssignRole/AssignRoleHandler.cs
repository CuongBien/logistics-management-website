using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Identity.Commands.AssignRole;

public record AssignRoleCommand(
    Guid WarehouseId,
    string OperatorSub,
    string RoleCode) : IRequest<Result<Guid>>;

public class AssignRoleHandler : IRequestHandler<AssignRoleCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public AssignRoleHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(AssignRoleCommand request, CancellationToken cancellationToken)
    {
        // 1. Tìm Operator
        var operatorProfile = await _context.OperatorProfiles
            .FirstOrDefaultAsync(x => x.OperatorSub == request.OperatorSub, cancellationToken);
        
        if (operatorProfile == null)
            return Result<Guid>.Failure(new Error("Operator.NotFound", $"Operator with sub '{request.OperatorSub}' not found. Have they logged in yet?"));

        // 2. Tìm Role
        var role = await _context.Roles
            .FirstOrDefaultAsync(x => x.Code == request.RoleCode, cancellationToken);

        if (role == null)
            return Result<Guid>.Failure(new Error("Role.NotFound", $"Role with code '{request.RoleCode}' not found."));

        // 3. Kiểm tra xem đã gán chưa
        var existing = await _context.OperatorRoleAssignments
            .FirstOrDefaultAsync(x => x.OperatorProfileId == operatorProfile.Id 
                                   && x.RoleId == role.Id 
                                   && x.WarehouseId == request.WarehouseId, cancellationToken);

        if (existing != null)
            return Result<Guid>.Success(existing.Id);

        // 4. Gán mới
        var assignment = new OperatorRoleAssignment(operatorProfile.Id, role.Id, request.WarehouseId, null);
        _context.OperatorRoleAssignments.Add(assignment);
        
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(assignment.Id);
    }
}
