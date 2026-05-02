using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class OutboundOrderConfiguration : IEntityTypeConfiguration<OutboundOrder>
{
    public void Configure(EntityTypeBuilder<OutboundOrder> builder)
    {
        builder.ToTable("OutboundOrders");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.TenantId).HasMaxLength(100).IsRequired();
        builder.Property(o => o.CustomerId).HasMaxLength(100).IsRequired();
        builder.Property(o => o.OrderId).IsRequired();
        builder.Property(o => o.DestinationWarehouseId).IsRequired();
        builder.Property(o => o.Status).IsRequired();

        builder.HasIndex(o => new { o.TenantId, o.OrderId }).IsUnique();

        builder.HasMany(o => o.Lines)
            .WithOne(l => l.Order)
            .HasForeignKey(l => l.OutboundOrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
