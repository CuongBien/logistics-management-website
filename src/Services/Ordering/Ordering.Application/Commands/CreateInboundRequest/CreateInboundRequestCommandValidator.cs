using FluentValidation;

namespace Ordering.Application.Commands.CreateInboundRequest;

public class CreateInboundRequestCommandValidator : AbstractValidator<CreateInboundRequestCommand>
{
    public CreateInboundRequestCommandValidator()
    {
        RuleFor(v => v.ConsignorId)
            .NotEmpty().WithMessage("Consignor ID is required.");
        
        RuleFor(v => v.TenantId)
            .NotEmpty().WithMessage("Tenant ID is required.");

        RuleFor(v => v.DestinationWarehouseCode)
            .NotEmpty().WithMessage("Destination warehouse code is required.");

        RuleFor(v => v.Items)
            .NotEmpty().WithMessage("At least one item is required.");

        RuleForEach(v => v.Items).SetValidator(new InboundItemDtoValidator());
    }
}

public class InboundItemDtoValidator : AbstractValidator<InboundItemDto>
{
    public InboundItemDtoValidator()
    {
        RuleFor(v => v.SkuCode)
            .NotEmpty().WithMessage("SKU code is required.");

        RuleFor(v => v.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than zero.");
    }
}
