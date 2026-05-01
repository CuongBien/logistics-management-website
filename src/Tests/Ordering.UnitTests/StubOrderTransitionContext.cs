using Ordering.Application.Common.Interfaces;

namespace Ordering.UnitTests;

public sealed class StubOrderTransitionContext : IOrderTransitionContext
{
    public StubOrderTransitionContext(string? operatorId, string? correlationId)
    {
        OperatorId = operatorId;
        CorrelationId = correlationId;
    }

    public string? OperatorId { get; }
    public string? CorrelationId { get; }
}
