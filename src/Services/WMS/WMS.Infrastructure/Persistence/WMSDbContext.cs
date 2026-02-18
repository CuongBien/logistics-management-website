using System.Reflection;
using Microsoft.EntityFrameworkCore;
using MassTransit;
using WMS.Application.Common.Interfaces;
using WMS.Domain.Entities;

namespace WMS.Infrastructure.Persistence;

public class WMSDbContext : DbContext, IApplicationDbContext
{
    public WMSDbContext(DbContextOptions<WMSDbContext> options) : base(options)
    {
    }

    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        base.OnModelCreating(builder);

        builder.AddInboxStateEntity();
        builder.AddOutboxMessageEntity();
        builder.AddOutboxStateEntity();
    }
}
