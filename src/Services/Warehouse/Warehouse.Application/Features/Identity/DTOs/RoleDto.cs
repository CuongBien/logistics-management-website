namespace Warehouse.Application.Features.Identity.DTOs;

public class RoleDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = default!;
    public string Name { get; set; } = default!;
    public List<PermissionDto> Permissions { get; set; } = new();
}
