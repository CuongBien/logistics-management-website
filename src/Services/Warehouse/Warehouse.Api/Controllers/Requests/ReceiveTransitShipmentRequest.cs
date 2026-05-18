using System;
using System.Collections.Generic;

namespace Warehouse.Api.Controllers.Requests;

public record ReceiveTransitShipmentRequest(
    Guid WarehouseId,
    Dictionary<string, int>? ReceivedItems = null
);
