using FluentValidation;

namespace WMS.Application.Features.Inventory.Commands.CreateInventoryItem;

public class CreateInventoryItemValidator : AbstractValidator<CreateInventoryItemCommand>
{
    public CreateInventoryItemValidator()
    {
        RuleFor(v => v.Sku)
            .NotEmpty().WithMessage("SKU is required.")
            .MaximumLength(50).WithMessage("SKU must not exceed 50 characters.");

        RuleFor(v => v.Quantity)
            .GreaterThanOrEqualTo(0).WithMessage("Initial quantity cannot be negative.");
    }
}
