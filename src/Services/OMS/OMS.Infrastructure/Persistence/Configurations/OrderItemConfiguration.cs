using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OMS.Domain.Entities;

namespace OMS.Infrastructure.Persistence.Configurations;

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.ProductId)
            .HasMaxLength(100)
            .IsRequired();

        builder.OwnsOne(o => o.UnitPrice, a =>
        {
            a.Property(p => p.Amount).HasPrecision(18, 2);
            a.Property(p => p.Currency).HasMaxLength(3);
        });
    }
}
