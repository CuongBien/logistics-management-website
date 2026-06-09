using Logistics.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Application.Features.Identity.Commands.AssignRole;
using Warehouse.Application.Features.Identity.Queries.GetRoleAssignments;

namespace Warehouse.Api.Controllers;

[Authorize] // Chỉ cho phép user đã đăng nhập
[ApiController]
[Route("api/[controller]")]
public class RoleAssignmentController : ControllerBase
{
    private readonly MediatR.IMediator _mediator;
    private readonly IApplicationDbContext _context;
    private readonly IOperatorAuthorizationService _authService;

    public RoleAssignmentController(
        MediatR.IMediator mediator,
        IApplicationDbContext context,
        IOperatorAuthorizationService authService)
    {
        _mediator = mediator;
        _context = context;
        _authService = authService;
    }

    private async Task<bool> HasRoleManagePermissionInAnyWarehouseAsync(string operatorSub)
    {
        if (string.Equals(operatorSub, "System", StringComparison.OrdinalIgnoreCase)) return true;
        var now = DateTime.UtcNow;
        return await _context.OperatorRoleAssignments
            .Where(a => a.OperatorProfile.OperatorSub == operatorSub && 
                        a.Status == Domain.Entities.AssignmentStatus.Active &&
                        (a.EffectiveFrom == null || a.EffectiveFrom <= now) &&
                        (a.EffectiveTo == null || a.EffectiveTo >= now))
            .SelectMany(a => a.Role.RolePermissions.Select(rp => rp.Permission.Code))
            .AnyAsync(code => code == "role:manage");
    }

    /// <summary>
    /// Gán Role cho một nhân viên tại một Kho cụ thể
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> AssignRole([FromBody] AssignRoleCommand command)
    {
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        var hasPermission = await _authService.HasPermissionAsync(operatorSub, command.WarehouseId, null, "role:manage");
        if (!hasPermission)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { Code = "Operator.Forbidden", Message = $"Operator '{operatorSub}' does not have 'role:manage' permission for warehouse '{command.WarehouseId}'." });
        }

        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Hủy gán vai trò của nhân viên (Unassign Role)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> UnassignRole(System.Guid id)
    {
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        var assignment = await _context.OperatorRoleAssignments.FindAsync(id);
        if (assignment == null) return NotFound();

        var hasPermission = await _authService.HasPermissionAsync(operatorSub, assignment.WarehouseId, null, "role:manage");
        if (!hasPermission)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { Code = "Operator.Forbidden", Message = $"Operator '{operatorSub}' does not have 'role:manage' permission for warehouse '{assignment.WarehouseId}'." });
        }

        var result = await _mediator.Send(new Warehouse.Application.Features.Identity.Commands.UnassignRole.UnassignRoleCommand(id));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Lấy danh sách quyền đã cấp
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetRoleAssignments()
    {
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        // Check if user has role:manage in at least one warehouse
        if (!await HasRoleManagePermissionInAnyWarehouseAsync(operatorSub))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { Code = "Operator.Forbidden", Message = $"Operator '{operatorSub}' does not have 'role:manage' permission in any warehouse." });
        }

        var result = await _mediator.Send(new GetRoleAssignmentsQuery(operatorSub));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Lấy danh sách các Roles có trong hệ thống
    /// </summary>
    [HttpGet("Roles")]
    public async Task<IActionResult> GetRoles()
    {
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        if (!await HasRoleManagePermissionInAnyWarehouseAsync(operatorSub))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { Code = "Operator.Forbidden", Message = $"Operator '{operatorSub}' does not have 'role:manage' permission in any warehouse." });
        }

        var result = await _mediator.Send(new Warehouse.Application.Features.Identity.Queries.GetRoles.GetRolesQuery());
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Lấy danh sách tất cả Permissions có trong hệ thống
    /// </summary>
    [HttpGet("Permissions")]
    public async Task<IActionResult> GetPermissions()
    {
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        if (!await HasRoleManagePermissionInAnyWarehouseAsync(operatorSub))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { Code = "Operator.Forbidden", Message = $"Operator '{operatorSub}' does not have 'role:manage' permission in any warehouse." });
        }

        var result = await _mediator.Send(new Warehouse.Application.Features.Identity.Queries.GetPermissions.GetPermissionsQuery());
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Tạo một Role mới
    /// </summary>
    [HttpPost("Roles")]
    public async Task<IActionResult> CreateRole([FromBody] Warehouse.Application.Features.Identity.Commands.CreateRole.CreateRoleCommand command)
    {
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        if (!await HasRoleManagePermissionInAnyWarehouseAsync(operatorSub))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { Code = "Operator.Forbidden", Message = $"Operator '{operatorSub}' does not have 'role:manage' permission in any warehouse." });
        }

        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Cập nhật Permissions cho một Role
    /// </summary>
    [HttpPut("Roles/{id}/Permissions")]
    public async Task<IActionResult> UpdateRolePermissions(Guid id, [FromBody] Warehouse.Application.Features.Identity.Commands.UpdateRolePermissions.UpdateRolePermissionsCommand command)
    {
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        if (!await HasRoleManagePermissionInAnyWarehouseAsync(operatorSub))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { Code = "Operator.Forbidden", Message = $"Operator '{operatorSub}' does not have 'role:manage' permission in any warehouse." });
        }

        command.RoleId = id;
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Xóa một Role ra khỏi hệ thống
    /// </summary>
    [HttpDelete("Roles/{id}")]
    public async Task<IActionResult> DeleteRole(Guid id)
    {
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        if (!await HasRoleManagePermissionInAnyWarehouseAsync(operatorSub))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { Code = "Operator.Forbidden", Message = $"Operator '{operatorSub}' does not have 'role:manage' permission in any warehouse." });
        }

        var result = await _mediator.Send(new Warehouse.Application.Features.Identity.Commands.DeleteRole.DeleteRoleCommand(id));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Lấy danh sách quyền và vai trò của user hiện tại
    /// </summary>
    [HttpGet("MyPermissions")]
    public async Task<IActionResult> GetMyPermissions()
    {
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        var now = DateTime.UtcNow;

        var permissions = await _context.OperatorRoleAssignments
            .Where(a => a.OperatorProfile.OperatorSub == operatorSub && 
                        a.Status == Domain.Entities.AssignmentStatus.Active &&
                        (a.EffectiveFrom == null || a.EffectiveFrom <= now) &&
                        (a.EffectiveTo == null || a.EffectiveTo >= now))
            .SelectMany(a => a.Role.RolePermissions.Select(rp => rp.Permission.Code))
            .Distinct()
            .ToListAsync();

        var warehousePermissions = await _context.OperatorRoleAssignments
            .Where(a => a.OperatorProfile.OperatorSub == operatorSub && 
                        a.Status == Domain.Entities.AssignmentStatus.Active &&
                        (a.EffectiveFrom == null || a.EffectiveFrom <= now) &&
                        (a.EffectiveTo == null || a.EffectiveTo >= now))
            .SelectMany(a => a.Role.RolePermissions.Select(rp => new {
                a.WarehouseId,
                a.ZoneId,
                PermissionCode = rp.Permission.Code
            }))
            .Distinct()
            .ToListAsync();

        var roles = await _context.OperatorRoleAssignments
            .Where(a => a.OperatorProfile.OperatorSub == operatorSub && 
                        a.Status == Domain.Entities.AssignmentStatus.Active &&
                        (a.EffectiveFrom == null || a.EffectiveFrom <= now) &&
                        (a.EffectiveTo == null || a.EffectiveTo >= now))
            .Select(a => new {
                a.WarehouseId,
                RoleCode = a.Role.Code
            })
            .Distinct()
            .ToListAsync();

        return Ok(Result<object>.Success(new {
            Permissions = permissions,
            WarehousePermissions = warehousePermissions,
            Roles = roles
        }));
    }

    /// <summary>
    /// Lấy chi tiết hiệu suất của một operator cụ thể
    /// </summary>
    [HttpGet("Operator/{operatorSub}/Performance")]
    public async Task<IActionResult> GetOperatorPerformance(string operatorSub)
    {
        var currentSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        if (!await HasRoleManagePermissionInAnyWarehouseAsync(currentSub))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { Code = "Operator.Forbidden", Message = $"Operator '{currentSub}' does not have permission to view operator performance." });
        }

        var result = await _mediator.Send(new Warehouse.Application.Features.Identity.Queries.GetOperatorPerformance.GetOperatorPerformanceQuery(operatorSub));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Lấy danh sách Operator Audit Logs (activity, override history, approvals)
    /// </summary>
    [HttpGet("Operator/audit-logs")]
    public async Task<IActionResult> GetOperatorAuditLogs(
        [FromQuery] string? operatorId,
        [FromQuery] string? taskType,
        [FromQuery] string? logType,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] Guid? warehouseId)
    {
        var currentSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        if (!await HasRoleManagePermissionInAnyWarehouseAsync(currentSub))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { Code = "Operator.Forbidden", Message = $"Operator '{currentSub}' does not have permission to view operator audit logs." });
        }

        var query = new Warehouse.Application.Features.Identity.Queries.GetOperatorAuditLogs.GetOperatorAuditLogsQuery(
            operatorId,
            taskType,
            logType,
            fromDate,
            toDate,
            warehouseId
        );
        var result = await _mediator.Send(query);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }
}
