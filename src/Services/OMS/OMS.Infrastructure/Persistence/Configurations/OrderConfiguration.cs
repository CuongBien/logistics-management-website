using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OMS.Domain.Entities;
using OMS.Domain.Enums;

namespace OMS.Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.ConsignorId)
            .HasMaxLength(100)
            .IsRequired();

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
        builder.Property(o => o.DestinationHubId).HasMaxLength(100);
        builder.Property(o => o.DeliveryDriverId).HasMaxLength(100);
        builder.Property(o => o.RouteId).HasMaxLength(100);
        builder.Property(o => o.ProofOfDeliveryUrl).HasMaxLength(500);
        builder.Property(o => o.FailureReason).HasMaxLength(500);

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

        // Ignore computed properties
        builder.Ignore(o => o.CustomerId);
    }
}
