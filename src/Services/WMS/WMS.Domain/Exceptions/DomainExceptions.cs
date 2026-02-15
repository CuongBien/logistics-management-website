using BuildingBlocks.Domain;

namespace WMS.Domain.Exceptions;

public class InsufficientStockException : DomainException
{
    public InsufficientStockException(string sku, int desiredQty, int availableQty)
        : base($"Insufficient stock for SKU '{sku}'. Desired: {desiredQty}, Available: {availableQty}.")
    {
    }
}

public class InventoryNotFoundException : NotFoundException
{
    public InventoryNotFoundException(Guid id) : base("Inventory", id)
    {
    }

    public InventoryNotFoundException(string sku) : base("Inventory", sku)
    {
    }
}
