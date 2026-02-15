using FluentValidation;

namespace OMS.Application.Commands.CreateOrder;

public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(v => v.CustomerId)
            .NotEmpty().WithMessage("Customer info is required.");

        RuleFor(v => v.ShippingAddress)
            .NotNull().WithMessage("Shipping address is required.");

        RuleFor(v => v.ShippingAddress.Street)
            .NotEmpty().WithMessage("Street is required.");
            
        RuleFor(v => v.ShippingAddress.City)
            .NotEmpty().WithMessage("City is required.");
            
        RuleFor(v => v.ShippingAddress.Country)
            .NotEmpty().WithMessage("Country is required.");

        RuleFor(v => v.Items)
            .NotEmpty().WithMessage("Order must contain at least one item.");

        RuleForEach(v => v.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductId).NotEmpty().WithMessage("Product ID is required.");
            item.RuleFor(i => i.Quantity).GreaterThan(0).WithMessage("Quantity must be greater than zero.");
            item.RuleFor(i => i.UnitPrice).GreaterThanOrEqualTo(0).WithMessage("Unit price cannot be negative.");
            item.RuleFor(i => i.Currency).NotEmpty().Length(3).WithMessage("Currency code must be 3 characters.");
        });
    }
}
