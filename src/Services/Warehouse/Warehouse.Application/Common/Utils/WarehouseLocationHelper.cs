namespace Warehouse.Application.Common.Utils;

public static class WarehouseLocationHelper
{
    private static readonly Dictionary<string, (double Lat, double Lon)> WarehouseCoords = new()
    {
        { "WH-CT-001", (10.037110, 105.788250) },
        { "WH-SG-002", (10.762622, 106.660172) },
        { "WH-NT-003", (12.238791, 109.196749) },
        { "WH-DN-004", (16.054407, 108.202164) },
        { "WH-V-005", (18.673470, 105.681290) },
        { "WH-HN-006", (21.028511, 105.804817) },
        { "WH-HP-007", (20.844912, 106.688079) }
    };

    public static bool TryGetCoordinates(string warehouseCode, out (double Lat, double Lon) coordinates)
    {
        if (string.IsNullOrEmpty(warehouseCode))
        {
            coordinates = (0, 0);
            return false;
        }
        return WarehouseCoords.TryGetValue(warehouseCode, out coordinates);
    }
}
