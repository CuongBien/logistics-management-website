using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class BinConfiguration : IEntityTypeConfiguration<Bin>
{
    public void Configure(EntityTypeBuilder<Bin> builder)
    {
        builder.ToTable("Bins");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.BinCode).HasMaxLength(50).IsRequired();
        builder.Property(b => b.Status).HasMaxLength(20).IsRequired();
        builder.Property(b => b.Version).IsRowVersion();

        builder.HasOne(b => b.Zone)
            .WithMany(z => z.Bins)
            .HasForeignKey(b => b.ZoneId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}