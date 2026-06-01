namespace Warehouse.Application.Features.Identity.DTOs;

public class PermissionDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = default!;
    public string Resource { get; set; } = default!;
    public string Action { get; set; } = default!;
}
