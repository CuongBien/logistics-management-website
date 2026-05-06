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

/// <summary>For tests that need to change operator between SaveChanges calls on the same DbContext.</summary>
public sealed class MutableStubOrderTransitionContext : IOrderTransitionContext
{
    public MutableStubOrderTransitionContext(string? operatorId, string? correlationId)
    {
        OperatorId = operatorId;
        CorrelationId = correlationId;
    }

    public string? OperatorId { get; set; }
    public string? CorrelationId { get; set; }
}
