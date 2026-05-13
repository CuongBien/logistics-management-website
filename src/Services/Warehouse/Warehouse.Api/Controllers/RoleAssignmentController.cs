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
}
