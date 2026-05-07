using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class InventoryReservationConfiguration : IEntityTypeConfiguration<InventoryReservation>
{
    public void Configure(EntityTypeBuilder<InventoryReservation> builder)
    {
        builder.ToTable("InventoryReservations");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.OutboundLineId).IsRequired();
        builder.Property(x => x.InventoryItemId).IsRequired();
        builder.Property(x => x.ReservedQty).IsRequired();
        builder.Property(x => x.Status).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.HasIndex(x => new { x.InventoryItemId, x.Status, x.ExpiresAt });
        builder.HasIndex(x => new { x.OutboundLineId, x.Status });
        builder.HasIndex(x => x.CorrelationId);
        // If using PostgreSQL, create a partial unique index to enforce idempotency when CorrelationId is provided
        builder.HasIndex(x => x.CorrelationId).IsUnique(false);

        // FK relation to InventoryItem (no cascade delete)
        builder.HasOne<InventoryItem>()
               .WithMany("Reservations")
               .HasForeignKey(x => x.InventoryItemId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
