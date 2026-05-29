using FluentValidation;

namespace Ordering.Application.Commands.CreateOrder;

public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(v => v.ConsignorId)
            .NotEmpty().WithMessage("Consignor ID is required.");
        
        RuleFor(v => v.TenantId)
            .NotEmpty().WithMessage("Tenant ID is required.");

        RuleFor(v => v.SkuCodes)
            .NotEmpty().WithMessage("At least one SKU code is required.");

        RuleFor(v => v.Consignee)
            .NotNull().WithMessage("Consignee info is required.");

        RuleFor(v => v.Consignee.FullName)
            .NotEmpty().WithMessage("Consignee name is required.")
            .When(v => v.FulfillmentMode != 2 && string.IsNullOrEmpty(v.Consignee?.PartnerId));
            
        RuleFor(v => v.Consignee.Phone)
            .NotEmpty().WithMessage("Consignee phone is required.")
            .When(v => v.FulfillmentMode != 2 && string.IsNullOrEmpty(v.Consignee?.PartnerId));

        RuleFor(v => v.Consignee.Address)
            .NotNull().WithMessage("Consignee address is required.")
            .When(v => v.FulfillmentMode != 2 && string.IsNullOrEmpty(v.Consignee?.PartnerId));

        RuleFor(v => v.Consignee.Address!.Street)
            .NotEmpty().WithMessage("Street is required.")
            .When(v => v.FulfillmentMode != 2 && string.IsNullOrEmpty(v.Consignee?.PartnerId) && v.Consignee?.Address != null);
            
        RuleFor(v => v.Consignee.Address!.City)
            .NotEmpty().WithMessage("City is required.")
            .When(v => v.FulfillmentMode != 2 && string.IsNullOrEmpty(v.Consignee?.PartnerId) && v.Consignee?.Address != null);

        RuleFor(v => v.CodAmount)
            .GreaterThanOrEqualTo(0).WithMessage("COD amount cannot be negative.");

        RuleFor(v => v.ShippingFee)
            .GreaterThanOrEqualTo(0).WithMessage("Shipping fee cannot be negative.");

        RuleFor(v => v.Weight)
            .GreaterThan(0).WithMessage("Weight must be greater than zero.");
    }
}
