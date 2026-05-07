using System;
using FluentAssertions;
using Warehouse.Domain.Entities;
using Xunit;

namespace Warehouse.UnitTests.Domain;

public class ExpireReservationTests
{
    [Fact]
    public void MarkExpired_ShouldSetStatusExpired()
    {
        var reservation = InventoryReservation.Create(Guid.NewGuid(), Guid.NewGuid(), 1, DateTime.UtcNow.AddMinutes(-5));
        reservation.MarkExpired();
        reservation.Status.Should().Be(InventoryReservationStatus.Expired);
    }
}
