using Ordering.Application.Common.Interfaces;

namespace Ordering.Infrastructure.Persistence;

/// <summary>
/// Fallback when no HTTP request scope (workers, tests). ApplicationDbContext uses Source = system when OperatorId is null.
/// </summary>
public sealed class NullOrderTransitionContext : IOrderTransitionContext
{
    public string? OperatorId => null;
    public string? CorrelationId => null;
}
