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
}
