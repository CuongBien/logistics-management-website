using Warehouse.Domain.Enums;

namespace Warehouse.Api.Controllers.Requests;

public record ResolveTransitDiscrepancyRequest(
    TransitDiscrepancyStatus NewStatus,
    string? Notes = null
);
