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
    }
}
