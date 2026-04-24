public class CreateInboundReceiptCommandValidator : AbstractValidator<CreateInboundReceiptCommand>
{
    public CreateInboundReceiptCommandValidator()
    {
        RuleFor(x => x.OrderIds)
           .NotEmpty()
           .WithMessage("OrderIds must not be empty.")
           .Must(orderIds => orderIds.Distinct().Count() == orderIds.Count)
           .WithMessage("OrderIds must not contain duplicated values.");
    }
}