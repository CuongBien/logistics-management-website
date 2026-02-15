using BuildingBlocks.Domain;

namespace WMS.Domain.Exceptions;

public class InsufficientStockException : DomainException
{
    public InsufficientStockException(string sku, int requested, int available)
        : base($"Insufficient stock for SKU '{sku}'. Requested: {requested}, Available: {available}.")
    {
    }
}

public class InventoryNotFoundException : NotFoundException
{
    public InventoryNotFoundException(Guid id)
        : base("Inventory", id)
    {
    }

    public InventoryNotFoundException(string sku)
        : base($"Inventory with SKU '{sku}' was not found.")
    {
    }
}
