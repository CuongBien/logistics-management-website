using Logistics.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.Application.Features.Identity.Commands.AssignRole;

namespace Warehouse.Api.Controllers;

[Authorize] // Chỉ cho phép user đã đăng nhập
[ApiController]
[Route("api/[controller]")]
public class RoleAssignmentController : ControllerBase
{
    private readonly MediatR.IMediator _mediator;

    public RoleAssignmentController(MediatR.IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Gán Role cho một nhân viên tại một Kho cụ thể
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> AssignRole([FromBody] AssignRoleCommand command)
    {
        // Lưu ý: Trong thực tế, endpoint này nên được bảo vệ bởi quyền 'admin:manage_roles'
        // Ở đây chúng ta cho phép để phục vụ việc test JIT RBAC
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Hủy gán vai trò của nhân viên (Unassign Role)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> UnassignRole(System.Guid id)
    {
        var result = await _mediator.Send(new Warehouse.Application.Features.Identity.Commands.UnassignRole.UnassignRoleCommand(id));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Lấy danh sách quyền đã cấp
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetRoleAssignments()
    {
        var result = await _mediator.Send(new Warehouse.Application.Features.Identity.Queries.GetRoleAssignments.GetRoleAssignmentsQuery());
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Lấy danh sách các Roles có trong hệ thống
    /// </summary>
    [HttpGet("Roles")]
    public async Task<IActionResult> GetRoles()
    {
        var result = await _mediator.Send(new Warehouse.Application.Features.Identity.Queries.GetRoles.GetRolesQuery());
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Lấy danh sách tất cả Permissions có trong hệ thống
    /// </summary>
    [HttpGet("Permissions")]
    public async Task<IActionResult> GetPermissions()
    {
        var result = await _mediator.Send(new Warehouse.Application.Features.Identity.Queries.GetPermissions.GetPermissionsQuery());
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Tạo một Role mới
    /// </summary>
    [HttpPost("Roles")]
    public async Task<IActionResult> CreateRole([FromBody] Warehouse.Application.Features.Identity.Commands.CreateRole.CreateRoleCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Cập nhật Permissions cho một Role
    /// </summary>
    [HttpPut("Roles/{id}/Permissions")]
    public async Task<IActionResult> UpdateRolePermissions(Guid id, [FromBody] Warehouse.Application.Features.Identity.Commands.UpdateRolePermissions.UpdateRolePermissionsCommand command)
    {
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
        var result = await _mediator.Send(new Warehouse.Application.Features.Identity.Commands.DeleteRole.DeleteRoleCommand(id));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }
}
