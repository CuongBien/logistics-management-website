using System.Reflection;
using Logistics.Core;
using Microsoft.EntityFrameworkCore;
using Ordering.Application.Common.Interfaces;
using Ordering.Domain.Entities;
using Ordering.Application.Sagas.OrderFulfillment;
using MediatR;
using MassTransit;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Ordering.Domain.Enums;

namespace Ordering.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly IMediator _mediator;
    private readonly IOrderTransitionContext _orderTransitionContext;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        IMediator mediator,
        IOrderTransitionContext orderTransitionContext) : base(options)
    {
        _mediator = mediator;
        _orderTransitionContext = orderTransitionContext;
    }

    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderStatusHistory> OrderStatusHistories => Set<OrderStatusHistory>();
    public DbSet<ErpSkuMirror> ErpSkuMirrors => Set<ErpSkuMirror>();
    public DbSet<ErpWarehouseMirror> ErpWarehouseMirrors => Set<ErpWarehouseMirror>();
    public DbSet<ErpSyncCheckpoint> ErpSyncCheckpoints => Set<ErpSyncCheckpoint>();
    public DbSet<Ordering.Application.Sagas.OrderFulfillment.OrderState> OrderStates => Set<Ordering.Application.Sagas.OrderFulfillment.OrderState>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        base.OnModelCreating(builder);

        builder.AddInboxStateEntity();
        builder.AddOutboxMessageEntity();
        builder.AddOutboxStateEntity();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var statusHistoryEntries = BuildStatusHistoryEntries();
        if (statusHistoryEntries.Count > 0)
        {
            OrderStatusHistories.AddRange(statusHistoryEntries);
        }

        await _mediator.DispatchDomainEvents(this);

        return await base.SaveChangesAsync(cancellationToken);
    }

    private List<OrderStatusHistory> BuildStatusHistoryEntries()
    {
        var utcNow = DateTime.UtcNow;
        var entries = new List<OrderStatusHistory>();
        var operatorId = _orderTransitionContext.OperatorId;
        var correlationId = _orderTransitionContext.CorrelationId;
        var source = string.IsNullOrWhiteSpace(operatorId) ? "system" : operatorId;

        foreach (EntityEntry<Order> entry in ChangeTracker.Entries<Order>())
        {
            if (entry.State != EntityState.Added && entry.State != EntityState.Modified)
            {
                continue;
            }

            if (entry.State == EntityState.Added)
            {
                entries.Add(new OrderStatusHistory(
                    entry.Entity.Id,
                    entry.Entity.TenantId,
                    "None",
                    entry.Entity.Status.ToString(),
                    utcNow,
                    source,
                    null,
                    operatorId,
                    correlationId));
                entry.Entity.ClearLastTransitionReasonAfterHistoryWritten();
                continue;
            }

            if (!entry.Property(x => x.Status).IsModified)
            {
                continue;
            }

            OrderStatus originalStatus = entry.Property(x => x.Status).OriginalValue;
            OrderStatus currentStatus = entry.Property(x => x.Status).CurrentValue;
            if (originalStatus == currentStatus)
            {
                continue;
            }

            entries.Add(new OrderStatusHistory(
                entry.Entity.Id,
                entry.Entity.TenantId,
                originalStatus.ToString(),
                currentStatus.ToString(),
                utcNow,
                source,
                entry.Entity.LastTransitionReason,
                operatorId,
                correlationId));
            entry.Entity.ClearLastTransitionReasonAfterHistoryWritten();
        }

        return entries;
    }
}
