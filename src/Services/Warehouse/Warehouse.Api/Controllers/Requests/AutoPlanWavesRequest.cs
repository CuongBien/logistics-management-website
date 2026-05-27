namespace Warehouse.Api.Controllers.Requests;

public class AutoPlanWavesRequest
{
    public Guid WarehouseId { get; set; }
    public int MaxSingleItemOrdersPerWave { get; set; } = 50;
    public int MaxMultiItemOrdersPerWave { get; set; } = 20;
}
