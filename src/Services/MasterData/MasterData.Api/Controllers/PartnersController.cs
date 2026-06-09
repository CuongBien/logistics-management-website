using MasterData.Application.Features.Partners.Commands.CreatePartner;
using MasterData.Application.Features.Partners.Commands.UpdatePartner;
using MasterData.Application.Features.Partners.Commands.DeactivatePartner;
using MasterData.Application.Features.Partners.Queries.GetPartners;
using MasterData.Application.Features.Partners.Queries.GetPartnerById;
using Logistics.Core;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace MasterData.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PartnersController : ControllerBase
{
    private readonly IMediator _mediator;

    public PartnersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePartnerCommand command)
    {
        // Inject tenantId if available
        var isSystemUser = User.IsInRole("Admin") || User.IsInRole("admin") || User.IsInRole("manager") || User.IsInRole("Manager") || User.IsInRole("operator") || User.IsInRole("Operator");
        var claimTenant = User.Claims.FirstOrDefault(c => c.Type == "tenant_id")?.Value ?? User.Claims.FirstOrDefault(c => c.Type == "tenant")?.Value;
        var claimSub = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
        
        // Customers store their address book under their own SUB. Admins/System users store in the TENANT.
        var effectiveTenantId = isSystemUser ? (claimTenant ?? "default-tenant") : (claimSub ?? "default-tenant");

        if (string.IsNullOrEmpty(command.TenantId))
        {
            command = command with { TenantId = effectiveTenantId };
        }

        if (string.IsNullOrWhiteSpace(command.Code))
        {
            command = command with { Code = $"CUST-{Guid.NewGuid().ToString()[..8].ToUpper()}" };
        }
        
        if (command.Type == 0)
        {
            command = command with { Type = MasterData.Domain.Enums.PartnerType.Consignee };
        }

        var result = await _mediator.Send(command);
        if (result.IsSuccess)
            return Ok(result.Value);
            
        return BadRequest(result.Error);
    }

    [HttpGet]
    public async Task<ActionResult<Result<PaginatedList<PartnerDto>>>> GetList(
        [FromQuery] string? searchTerm,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? tenantId = null)
    {
        var isSystemUser = User.IsInRole("Admin") || User.IsInRole("admin") || User.IsInRole("manager") || User.IsInRole("Manager") || User.IsInRole("operator") || User.IsInRole("Operator");
        var claimTenant = User.Claims.FirstOrDefault(c => c.Type == "tenant_id")?.Value ?? User.Claims.FirstOrDefault(c => c.Type == "tenant")?.Value;
        var claimSub = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
        
        var effectiveTenantId = isSystemUser 
            ? (string.IsNullOrWhiteSpace(tenantId) ? (claimTenant ?? "default-tenant") : tenantId)
            : (claimSub ?? "default-tenant");

        var query = new GetPartnersQuery(effectiveTenantId, searchTerm, page, pageSize);
        var result = await _mediator.Send(query);
        return result.IsFailure ? BadRequest(result) : Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Result<PartnerDto>>> GetById(Guid id, [FromQuery] string? tenantId = null)
    {
        var isSystemUser = User.IsInRole("Admin") || User.IsInRole("admin") || User.IsInRole("manager") || User.IsInRole("Manager") || User.IsInRole("operator") || User.IsInRole("Operator");
        var claimTenant = User.Claims.FirstOrDefault(c => c.Type == "tenant_id")?.Value ?? User.Claims.FirstOrDefault(c => c.Type == "tenant")?.Value;
        var claimSub = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
        
        var effectiveTenantId = isSystemUser 
            ? (string.IsNullOrWhiteSpace(tenantId) ? (claimTenant ?? "default-tenant") : tenantId)
            : (claimSub ?? "default-tenant");

        var query = new GetPartnerByIdQuery(id, effectiveTenantId);
        var result = await _mediator.Send(query);
        return result.IsFailure ? BadRequest(result) : Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Result>> Update(Guid id, [FromBody] UpdatePartnerRequest request, [FromQuery] string? tenantId = null)
    {
        var isSystemUser = User.IsInRole("Admin") || User.IsInRole("admin") || User.IsInRole("manager") || User.IsInRole("Manager") || User.IsInRole("operator") || User.IsInRole("Operator");
        var claimTenant = User.Claims.FirstOrDefault(c => c.Type == "tenant_id")?.Value ?? User.Claims.FirstOrDefault(c => c.Type == "tenant")?.Value;
        var claimSub = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
        
        var effectiveTenantId = isSystemUser 
            ? (string.IsNullOrWhiteSpace(tenantId) ? (claimTenant ?? "default-tenant") : tenantId)
            : (claimSub ?? "default-tenant");

        var command = new UpdatePartnerCommand(
            id,
            effectiveTenantId,
            request.Name,
            request.Phone,
            request.Address,
            request.City,
            request.Latitude,
            request.Longitude
        );

        var result = await _mediator.Send(command);
        return result.IsFailure ? BadRequest(result) : Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<Result>> Deactivate(Guid id, [FromQuery] string? tenantId = null)
    {
        var isSystemUser = User.IsInRole("Admin") || User.IsInRole("admin") || User.IsInRole("manager") || User.IsInRole("Manager") || User.IsInRole("operator") || User.IsInRole("Operator");
        var claimTenant = User.Claims.FirstOrDefault(c => c.Type == "tenant_id")?.Value ?? User.Claims.FirstOrDefault(c => c.Type == "tenant")?.Value;
        var claimSub = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
        
        var effectiveTenantId = isSystemUser 
            ? (string.IsNullOrWhiteSpace(tenantId) ? (claimTenant ?? "default-tenant") : tenantId)
            : (claimSub ?? "default-tenant");

        var command = new DeactivatePartnerCommand(id, effectiveTenantId);
        var result = await _mediator.Send(command);
        return result.IsFailure ? BadRequest(result) : Ok(result);
    }
}

public record UpdatePartnerRequest(
    string Name,
    string? Phone,
    string? Address,
    string? City,
    double? Latitude,
    double? Longitude
);
