using FluentValidation;

namespace OMS.Application.Commands.CreateOrder;

public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(v => v.ConsignorId)
            .NotEmpty().WithMessage("Consignor ID is required.");

        RuleFor(v => v.Consignee)
            .NotNull().WithMessage("Consignee info is required.");

        RuleFor(v => v.Consignee.FullName)
            .NotEmpty().WithMessage("Consignee name is required.");
            
        RuleFor(v => v.Consignee.Phone)
            .NotEmpty().WithMessage("Consignee phone is required.");

        RuleFor(v => v.Consignee.Address)
            .NotNull().WithMessage("Consignee address is required.");

        RuleFor(v => v.Consignee.Address.Street)
            .NotEmpty().WithMessage("Street is required.");
            
        RuleFor(v => v.Consignee.Address.City)
            .NotEmpty().WithMessage("City is required.");

        RuleFor(v => v.CodAmount)
            .GreaterThanOrEqualTo(0).WithMessage("COD amount cannot be negative.");

        RuleFor(v => v.Weight)
            .GreaterThan(0).WithMessage("Weight must be greater than zero.");
    }
}
