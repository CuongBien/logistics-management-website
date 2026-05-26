using Warehouse.Domain.Enums;

namespace Warehouse.Api.Controllers.Requests;

public class ProcessReturnDispositionRequest
{
    public Guid WarehouseId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public ReturnCondition Condition { get; set; }
    public string? TargetBinCode { get; set; }
    public string? ReferenceId { get; set; }
    public string? ReferenceType { get; set; }
    public string Notes { get; set; } = string.Empty;
}
