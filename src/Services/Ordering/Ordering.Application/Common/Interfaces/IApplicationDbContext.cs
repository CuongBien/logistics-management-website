using Microsoft.EntityFrameworkCore;
using Ordering.Domain.Entities;
using Ordering.Application.Sagas.OrderFulfillment;

namespace Ordering.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Order> Orders { get; }
    DbSet<OrderState> OrderStates { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
