using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ordering.Domain.Entities;

namespace Ordering.Infrastructure.Persistence.Configurations;

public sealed class OrderStatusHistoryConfiguration : IEntityTypeConfiguration<OrderStatusHistory>
{
    public void Configure(EntityTypeBuilder<OrderStatusHistory> builder)
    {
        builder.ToTable("OrderStatusHistories");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.OrderId).IsRequired();
        builder.Property(x => x.TenantId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.StatusFrom).HasMaxLength(50).IsRequired();
        builder.Property(x => x.StatusTo).HasMaxLength(50).IsRequired();
        builder.Property(x => x.ChangedAtUtc).IsRequired();
        builder.Property(x => x.Source).HasMaxLength(120).IsRequired();

        builder.HasIndex(x => new { x.OrderId, x.ChangedAtUtc });
        builder.HasIndex(x => new { x.TenantId, x.ChangedAtUtc });

        builder
            .HasOne(x => x.Order)
            .WithMany()
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
