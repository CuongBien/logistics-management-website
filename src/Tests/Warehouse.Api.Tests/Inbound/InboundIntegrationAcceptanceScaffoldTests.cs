// Spec: specs/001-inbound-schema/spec.md
// Test plan: specs/001-inbound-schema/test-plan.md

using Microsoft.EntityFrameworkCore;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using Warehouse.Infrastructure.Persistence;
using Xunit;

namespace Warehouse.Api.Tests.Inbound;

/// <summary>
/// Persistence / EF model tests (InMemory where applicable).
/// Trace: SC-001, AC-071; AC-053–054; FR-010 (putaway still product gap).
/// </summary>
public sealed class InboundIntegrationAcceptanceScaffoldTests
{
    /// <summary>
    /// EF InMemory does not enforce PostgreSQL filtered unique indexes reliably; we assert the model carries the idempotency constraint instead.
    /// Duplicate rows are still prevented in production by SQL Server/Postgres when migrations run.
    /// </summary>
    [Fact]
    public void Model_WhenInboundReceiptMapped_ThenIdempotencyCompositeIsUnique()
    {
        using var ctx = InboundTestFixtures.CreateInMemoryDb();
        var entity = ctx.Model.FindEntityType(typeof(InboundReceipt));
        Assert.NotNull(entity);
        var idempotencyIndex = entity!.GetIndexes().FirstOrDefault(i =>
            i.IsUnique &&
            i.Properties.Count == 4 &&
            i.Properties.Any(p => p.Name == nameof(InboundReceipt.SourceRef)));
        Assert.NotNull(idempotencyIndex);
    }

    [Fact]
    public void Model_WhenDispositionLogMapped_ThenNoForeignKeyToInboundLine()
    {
        using var ctx = InboundTestFixtures.CreateInMemoryDb();
        var entityType = ctx.Model.FindEntityType(typeof(DispositionLog));
        Assert.NotNull(entityType);
        Assert.DoesNotContain(
            entityType.GetForeignKeys(),
            fk => fk.PrincipalEntityType.ClrType == typeof(InboundReceiptLine));
    }

    [Fact]
    public void Allocation_WhenSumExceedsReceived_ThenRejected()
    {
        var receipt = new InboundReceipt("t1", "c1", Guid.NewGuid(), "RV", "PURCHASE_ORDER", Guid.NewGuid().ToString(), "S");
        var line = new InboundReceiptLine(receipt.Id, 1, "t1", "c1", "SKU-A", "EA", 100);
        line.Receive(50);
        line.AddAllocation(new InboundBinAllocation(line.Id, Guid.NewGuid(), 30, "t1"));
        line.AddAllocation(new InboundBinAllocation(line.Id, Guid.NewGuid(), 20, "t1"));

        Assert.Throws<InvalidOperationException>(() =>
            line.AddAllocation(new InboundBinAllocation(line.Id, Guid.NewGuid(), 1, "t1")));
    }

    [Fact(Skip = "FR-010 not implemented: ReceiveInboundItemCommandHandler does not validate bin type vs inventory status.")]
    public void Putaway_WhenBinTypeMismatchesInventoryStatus_ThenRejected() { }
}
