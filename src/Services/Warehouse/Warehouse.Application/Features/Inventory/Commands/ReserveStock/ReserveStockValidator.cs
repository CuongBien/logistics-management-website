using FluentValidation;

namespace Warehouse.Application.Features.Inventory.Commands.ReserveStock;

public class ReserveStockValidator : AbstractValidator<ReserveStockCommand>
{
    public ReserveStockValidator()
    {
        RuleFor(v => v.Sku)
            .NotEmpty().WithMessage("SKU is required.");

        RuleFor(v => v.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than zero.");
    }
}
