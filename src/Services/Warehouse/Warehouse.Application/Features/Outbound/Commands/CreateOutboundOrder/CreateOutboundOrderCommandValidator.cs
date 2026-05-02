using FluentValidation;

namespace Warehouse.Application.Features.Outbound.Commands.CreateOutboundOrder;

public class CreateOutboundOrderCommandValidator : AbstractValidator<CreateOutboundOrderCommand>
{
    public CreateOutboundOrderCommandValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty();

        RuleFor(x => x.DestinationWarehouseId)
            .NotEmpty();

        RuleFor(x => x.TenantId)
            .NotEmpty();

        RuleFor(x => x.CustomerId)
            .NotEmpty();

        RuleFor(x => x.Lines)
            .NotEmpty()
            .WithMessage("At least one line is required.");

        RuleForEach(x => x.Lines)
            .ChildRules(line =>
            {
                line.RuleFor(l => l.SkuCode)
                    .NotEmpty()
                    .WithMessage("SkuCode must not be empty.");

                line.RuleFor(l => l.RequestedQty)
                    .GreaterThan(0)
                    .WithMessage("RequestedQty must be greater than zero.");
            });
    }
}
