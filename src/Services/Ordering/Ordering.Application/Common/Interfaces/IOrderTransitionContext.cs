namespace Ordering.Application.Common.Interfaces;

public interface IOrderTransitionContext
{
    string? OperatorId { get; }
    string? CorrelationId { get; }
}
