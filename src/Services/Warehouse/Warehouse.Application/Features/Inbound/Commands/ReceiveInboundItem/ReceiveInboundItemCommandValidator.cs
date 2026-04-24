using FluentValidation;

namespace Warehouse.Application.Features.Inbound.Commands.ReceiveInboundItem;

public class ReceiveInboundItemCommandValidator : AbstractValidator<ReceiveInboundItemCommand>
{
    public ReceiveInboundItemCommandValidator()
    {
        RuleFor(x => x.ReceiptId)
            .NotEmpty().WithMessage("ReceiptId must not be empty.");

        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("OrderId must not be empty.");

        RuleFor(x => x.BinCode)
            .NotEmpty().WithMessage("BinCode must not be empty.");

        RuleFor(x => x.ScannedBy)
            .NotEmpty().WithMessage("ScannedBy must not be empty.");
    }
}