using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Identity.Commands.AssignRole;

public record AssignRoleCommand(
    Guid WarehouseId,
    string OperatorSub,
    string RoleCode,
    string? DisplayName = null,
    string? FullName = null,
    string? Email = null,
    string? Phone = null,
    string? EmployeeCode = null) : IRequest<Result<Guid>>;

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
        {
            // Tự động khởi tạo OperatorProfile mới để tránh lỗi 400 Bad Request
            var name = !string.IsNullOrEmpty(request.DisplayName) ? request.DisplayName : (request.FullName ?? "New Staff");
            operatorProfile = new OperatorProfile("default-tenant", request.OperatorSub, name);
            operatorProfile.UpdatePersonalDetails(request.FullName, request.Email, request.Phone, request.EmployeeCode);
            _context.OperatorProfiles.Add(operatorProfile);
            await _context.SaveChangesAsync(cancellationToken);
            
            Console.WriteLine($"Automatically provisioned OperatorProfile for sub '{request.OperatorSub}' with name '{name}'");
        }
        else
        {
            operatorProfile.UpdatePersonalDetails(
                request.FullName ?? operatorProfile.FullName,
                request.Email ?? operatorProfile.Email,
                request.Phone ?? operatorProfile.Phone,
                request.EmployeeCode ?? operatorProfile.EmployeeCode
            );
            await _context.SaveChangesAsync(cancellationToken);
        }

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
