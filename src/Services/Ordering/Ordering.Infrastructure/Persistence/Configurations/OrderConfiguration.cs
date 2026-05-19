using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ordering.Domain.Entities;
using Ordering.Domain.Enums;

namespace Ordering.Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.ConsignorId)
            .HasMaxLength(100)
            .IsRequired();
        
        builder.Property(o => o.TenantId)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(o => o.CustomerIdInternal)
            .HasColumnName("CustomerId")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(o => o.ExternalReference)
            .HasMaxLength(100);

        builder.Property(o => o.WaybillCode)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(o => o.WaybillCode).IsUnique();

        builder.Property(o => o.Status)
            .HasConversion(
                v => v.ToString(),
                v => (OrderStatus)Enum.Parse(typeof(OrderStatus), v));

        builder.Property(o => o.CodAmount)
            .HasColumnType("decimal(18,2)");

        builder.Property(o => o.ShippingFee)
            .HasColumnType("decimal(18,2)");

        builder.Property(o => o.Weight)
            .HasColumnType("decimal(10,2)");

        builder.Property(o => o.Note).HasMaxLength(500);
        builder.Property(o => o.PickupDriverId).HasMaxLength(100);
        builder.Property(o => o.WarehouseId).HasMaxLength(100);
        builder.Property(o => o.DestinationWarehouseId).HasMaxLength(100);
        builder.Property(o => o.DeliveryDriverId).HasMaxLength(100);
        builder.Property(o => o.RouteId).HasMaxLength(100);
        builder.Property(o => o.ProofOfDeliveryUrl).HasMaxLength(500);
        builder.Property(o => o.FailureReason).HasMaxLength(500);
        builder.Property(o => o.CreatedByOperatorId).HasMaxLength(100);
        builder.Property(o => o.UpdatedByOperatorId).HasMaxLength(100);

        builder.Property(o => o.Type)
            .HasConversion(
                v => (int)v,
                v => (OrderType)v)
            .IsRequired()
            .HasDefaultValue(OrderType.Parcel);

        builder.Property(o => o.Fulfillment)
            .HasConversion(
                v => (int)v,
                v => (FulfillmentMode)v)
            .IsRequired()
            .HasDefaultValue(FulfillmentMode.Pickup);

        // Consignee owned type
        builder.OwnsOne(o => o.Consignee, consignee =>
        {
            consignee.Property(c => c.FullName).HasMaxLength(200).IsRequired();
            consignee.Property(c => c.Phone).HasMaxLength(20).IsRequired();
            
            consignee.OwnsOne(c => c.Address, address =>
            {
                address.Property(a => a.Street).HasMaxLength(200).IsRequired();
                address.Property(a => a.City).HasMaxLength(100).IsRequired();
                address.Property(a => a.State).HasMaxLength(100);
                address.Property(a => a.Country).HasMaxLength(100).IsRequired();
                address.Property(a => a.ZipCode).HasMaxLength(20).IsRequired();
            });
        });

        builder.HasMany(o => o.Items)
            .WithOne(oi => oi.Order)
            .HasForeignKey(oi => oi.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Ignore computed / non-persisted properties
        builder.Ignore(o => o.CustomerId);
        builder.Ignore(o => o.LastTransitionReason);

        builder.HasIndex(o => new { o.TenantId, o.CustomerIdInternal });
        builder.HasIndex(o => new { o.Status, o.CreatedAt });
        builder.HasIndex(o => new { o.DestinationWarehouseId, o.Status });

        builder.HasIndex(o => new { o.TenantId, o.CustomerIdInternal, o.ExternalReference })
            .IsUnique()
            .HasFilter("\"ExternalReference\" IS NOT NULL");

        builder.HasIndex(o => o.CreatedByOperatorId)
            .HasFilter("\"CreatedByOperatorId\" IS NOT NULL");

        builder.HasIndex(o => o.UpdatedByOperatorId)
            .HasFilter("\"UpdatedByOperatorId\" IS NOT NULL");
    }
}

