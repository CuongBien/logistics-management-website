using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class InventoryLedgerConfiguration : IEntityTypeConfiguration<InventoryLedger>
{
    public void Configure(EntityTypeBuilder<InventoryLedger> builder)
    {
        builder.ToTable("InventoryLedgers");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.InventoryItemId).IsRequired();
        builder.Property(x => x.TransactionType).IsRequired();
        builder.Property(x => x.QuantityChange).IsRequired();
        builder.Property(x => x.BalanceAfter).IsRequired();
        builder.Property(x => x.ReferenceId).IsRequired().HasMaxLength(100);
        builder.Property(x => x.CreatedAt).IsRequired();

        // Index quan trọng để truy vấn lịch sử biến động của 1 mặt hàng theo thời gian
        builder.HasIndex(x => new { x.InventoryItemId, x.CreatedAt });
        
        // Index để tra cứu theo mã tham chiếu (ví dụ tìm xem đơn hàng X đã ghi ledger chưa)
        builder.HasIndex(x => x.ReferenceId);

        builder.HasOne(x => x.InventoryItem)
            .WithMany()
            .HasForeignKey(x => x.InventoryItemId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
