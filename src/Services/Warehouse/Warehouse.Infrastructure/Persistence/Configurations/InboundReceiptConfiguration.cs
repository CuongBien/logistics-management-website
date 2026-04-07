using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class InboundReceiptConfiguration : IEntityTypeConfiguration<InboundReceipt>
{
    public void Configure(EntityTypeBuilder<InboundReceipt> builder)
    {
        builder.ToTable("InboundReceipts");

        builder.HasKey(ir => ir.Id);

        builder.Property(ir => ir.OrderId).IsRequired();
        builder.Property(ir => ir.Status).IsRequired();
        builder.Property(ir => ir.ReceivedAt);

        builder.HasMany(ir => ir.Items)
            .WithOne(ii => ii.Receipt)
            .HasForeignKey(ii => ii.ReceiptId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}