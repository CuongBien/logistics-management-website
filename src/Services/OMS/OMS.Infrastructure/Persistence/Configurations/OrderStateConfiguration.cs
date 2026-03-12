using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OMS.Application.Sagas.OrderFulfillment;

namespace OMS.Infrastructure.Persistence.Configurations;

public class OrderStateConfiguration : IEntityTypeConfiguration<OrderState>
{
    public void Configure(EntityTypeBuilder<OrderState> entity)
    {
        entity.HasKey(x => x.CorrelationId);
        entity.Property(x => x.CurrentState).HasMaxLength(64);
        entity.Property(x => x.ConsignorId).HasMaxLength(256);
        entity.Property(x => x.WaybillCode).HasMaxLength(50);
        entity.Property(x => x.CodAmount).HasColumnType("decimal(18,2)");
        entity.Property(x => x.PickupDriverId).HasMaxLength(100);
        entity.Property(x => x.WarehouseId).HasMaxLength(100);
        entity.Property(x => x.DestinationHubId).HasMaxLength(100);
        entity.Property(x => x.DeliveryDriverId).HasMaxLength(100);
        entity.Property(x => x.RouteId).HasMaxLength(100);
        entity.Property(x => x.ProofOfDeliveryUrl).HasMaxLength(500);
        entity.Property(x => x.FailureReason).HasMaxLength(500);
    }
}
