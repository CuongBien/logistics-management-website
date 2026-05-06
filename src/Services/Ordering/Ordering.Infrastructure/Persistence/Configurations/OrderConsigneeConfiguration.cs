using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ordering.Domain.Entities;

namespace Ordering.Infrastructure.Persistence.Configurations;

public class OrderConsigneeConfiguration : IEntityTypeConfiguration<OrderConsignee>
{
    public void Configure(EntityTypeBuilder<OrderConsignee> builder)
    {
        builder.ToTable("OrderConsignees");

        builder.HasKey(x => x.OrderId);

        builder.Property(x => x.FullName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Phone).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Street).HasMaxLength(200).IsRequired();
        builder.Property(x => x.City).HasMaxLength(100).IsRequired();
        builder.Property(x => x.State).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Country).HasMaxLength(100).IsRequired();
        builder.Property(x => x.ZipCode).HasMaxLength(20).IsRequired();

        builder.HasOne<Order>()
            .WithOne()
            .HasForeignKey<OrderConsignee>(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
