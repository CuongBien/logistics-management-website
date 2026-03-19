namespace Warehouse.Application.Features.Inventory.Dtos;

public record InventoryItemDto(
    Guid Id,
    string Sku,
    int QuantityOnHand,
    int ReservedQty,
    int AvailableQty,
    DateTime? LastRestockedAt
);
