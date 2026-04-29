using Microsoft.EntityFrameworkCore;
using Ordering.Domain.Entities;
using Ordering.Application.Sagas.OrderFulfillment;

namespace Ordering.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<ErpSkuMirror> ErpSkuMirrors { get; }
    DbSet<ErpWarehouseMirror> ErpWarehouseMirrors { get; }
    DbSet<ErpSyncCheckpoint> ErpSyncCheckpoints { get; }
    DbSet<Ordering.Application.Sagas.OrderFulfillment.OrderState> OrderStates { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
