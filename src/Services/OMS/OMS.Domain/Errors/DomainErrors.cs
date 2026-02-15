using BuildingBlocks.Domain;

namespace OMS.Domain.Errors;

public static class DomainErrors
{
    public static class Order
    {
        public static Error NotFound => new("Order.NotFound", "The order was not found.");
        public static Error CannotCancel => new("Order.CannotCancel", "Order cannot be cancelled at this stage.");
        public static Error EmptyItems => new("Order.EmptyItems", "Order must have at least one item.");
        public static Error InvalidQuantity => new("Order.InvalidQuantity", "Item quantity must be greater than zero.");
        public static Error InvalidPrice => new("Order.InvalidPrice", "Item price must be non-negative.");
    }
}
