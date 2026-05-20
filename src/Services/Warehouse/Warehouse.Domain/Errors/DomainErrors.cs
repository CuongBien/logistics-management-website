using Logistics.Core;

namespace Warehouse.Domain.Errors;

public static class DomainErrors
{
    public static class Inventory
    {
        public static Error SkuAlreadyExists(string sku) => new("Inventory.SkuAlreadyExists", $"Inventory with SKU '{sku}' already exists.");
        public static Error NotFound(Guid id) => new("Inventory.NotFound", $"Inventory with Id '{id}' was not found.");
        public static Error NotFound(string sku) => new("Inventory.NotFound", $"Inventory with SKU '{sku}' was not found.");
        public static Error InsufficientStock(string sku) => new("Inventory.InsufficientStock", $"Insufficient stock for SKU '{sku}'.");
    }

    public static class Outbound
    {
        public static Error AlreadyExists(Guid orderId) =>
            new("Outbound.AlreadyExists", $"An outbound order for OMS Order '{orderId}' already exists.");

        public static Error ForbiddenWarehouseScope(string operatorSub, Guid warehouseId) =>
            new(
                "Outbound.ForbiddenWarehouseScope",
                $"Operator '{operatorSub}' is not allowed to plan outbound for warehouse '{warehouseId}'.");

        public static Error LineInvalid(string message) =>
            new("Outbound.LineInvalid", message);

        public static Error NotFound(Guid id) =>
            new("Outbound.NotFound", $"Outbound order '{id}' was not found.");
    }
}
