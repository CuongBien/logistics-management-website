using Warehouse.Domain.Enums;

namespace Warehouse.Api.Controllers.Requests;

public class ResolveInboundDiscrepancyRequest
{
    public InboundDiscrepancyStatus NewStatus { get; set; }
    public string? Notes { get; set; }
}
