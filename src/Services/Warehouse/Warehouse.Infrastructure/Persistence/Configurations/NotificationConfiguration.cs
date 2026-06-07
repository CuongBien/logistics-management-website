using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");

        builder.HasKey(n => n.Id);

        builder.Property(n => n.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(n => n.Message)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(n => n.TargetUserId)
            .HasMaxLength(50);

        builder.Property(n => n.TargetRole)
            .HasMaxLength(50);
            
        builder.HasIndex(n => n.WarehouseId);
        builder.HasIndex(n => n.TargetUserId);
        builder.HasIndex(n => n.IsRead);
    }
}
