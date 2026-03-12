using Microsoft.EntityFrameworkCore;
using OMS.Domain.Entities;
using OMS.Application.Sagas.OrderFulfillment;

namespace OMS.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Order> Orders { get; }
    DbSet<OrderState> OrderStates { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
