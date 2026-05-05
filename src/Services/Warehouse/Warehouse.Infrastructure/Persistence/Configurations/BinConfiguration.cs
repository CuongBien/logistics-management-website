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
        builder.HasQueryFilter(b => !b.IsDeleted);

        builder.Property(b => b.BinCode).HasMaxLength(50).IsRequired();
        builder.HasIndex(b => new { b.ZoneId, b.BinCode }).IsUnique();
        builder.Property(b => b.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(b => b.Version).IsConcurrencyToken();

        builder.HasOne(b => b.Zone)
            .WithMany(z => z.Bins)
            .HasForeignKey(b => b.ZoneId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}