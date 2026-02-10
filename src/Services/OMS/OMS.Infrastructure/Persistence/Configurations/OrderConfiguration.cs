using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OMS.Domain.Entities;
using OMS.Domain.Enums;

namespace OMS.Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.CustomerId)
            .HasMaxLength(200)
            .IsRequired();

        builder.OwnsOne(o => o.ShippingAddress, a =>
        {
            a.Property(p => p.Street).HasMaxLength(100).IsRequired();
            a.Property(p => p.City).HasMaxLength(50).IsRequired();
            a.Property(p => p.State).HasMaxLength(50);
            a.Property(p => p.Country).HasMaxLength(50).IsRequired();
            a.Property(p => p.ZipCode).HasMaxLength(20).IsRequired();
        });

        builder.Property(t => t.Status)
            .HasConversion<string>(); // Store enum as string
            
        // Configure OrderItems relationship
        builder.HasMany(o => o.Items)
            .WithOne()
            .HasForeignKey("OrderId")
            .OnDelete(DeleteBehavior.Cascade);
    }
}
