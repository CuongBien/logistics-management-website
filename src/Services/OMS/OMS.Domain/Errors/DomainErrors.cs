using BuildingBlocks.Domain;

namespace OMS.Domain.Errors;

public static class DomainErrors
{
    public static class Order
    {
        public static Error NotFound => new("Order.NotFound", "The order was not found.");
        public static Error CannotCancel => new("Order.CannotCancel", "Order cannot be cancelled at this stage.");
        public static Error InvalidTransition(string from, string to) 
            => new("Order.InvalidTransition", $"Cannot transition from '{from}' to '{to}'.");
        public static Error InvalidCodAmount => new("Order.InvalidCodAmount", "COD amount must be non-negative.");
        public static Error InvalidWeight => new("Order.InvalidWeight", "Weight must be greater than zero.");
    }
}
