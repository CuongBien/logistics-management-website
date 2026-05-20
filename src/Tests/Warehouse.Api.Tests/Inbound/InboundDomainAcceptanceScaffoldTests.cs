// Spec: specs/001-inbound-schema/spec.md
// Test plan: specs/001-inbound-schema/test-plan.md

using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using Xunit;

namespace Warehouse.Api.Tests.Inbound;

/// <summary>
/// Domain-level acceptance for InboundReceiptLine and InboundReceipt.
/// Trace: FR-003…FR-009, FR-015; AC-010–012, AC-020–021, AC-030–032, AC-040–041.
/// AC-042 / AC-082 (immutable completed receipt): enforced in <see cref="Warehouse.Application.Features.Inbound.Commands.ReceiveInboundItem.ReceiveInboundItemCommandHandler"/>.
/// </summary>
public sealed class InboundDomainAcceptanceScaffoldTests
{
    private static InboundReceipt NewReceipt(string tenant = "t1", string customer = "c1")
        => new(tenant, customer, Guid.NewGuid(), "RCV-TEST", "PURCHASE_ORDER", Guid.NewGuid().ToString(), "SHIP-1");

    [Fact]
    public void AC010_WhenReceivedPlusRejectedWouldExceedExpected_ThenThrows()
    {
        var receipt = NewReceipt();
        var line = new InboundReceiptLine(receipt.Id, 1, "t1", "c1", "SKU-A", "EA", 100);
        InboundDomainTestHelper.BindLineToReceipt(receipt, line);
        receipt.AddLine(line);
        line.Receive(80, 0);

        Assert.Throws<InvalidOperationException>(() => line.Receive(0, 30, "later damage"));
    }

    [Fact]
    public void AC011_WhenReceivedAndRejectedSumWithinExpected_ThenSucceeds()
    {
        var receipt = NewReceipt();
        var line = new InboundReceiptLine(receipt.Id, 1, "t1", "c1", "SKU-A", "EA", 100);
        InboundDomainTestHelper.BindLineToReceipt(receipt, line);
        receipt.AddLine(line);
        line.Receive(70, 30, "outer damage");

        Assert.Equal(70, line.ReceivedQty);
        Assert.Equal(30, line.RejectedQty);
        Assert.Equal(InboundReceiptLineStatus.Completed, line.Status);
        Assert.NotNull(line.RejectionReason);
    }

    [Fact]
    public void AC012_WhenFullGoodQtyReceived_ThenLineCompleted()
    {
        var receipt = NewReceipt();
        var line = new InboundReceiptLine(receipt.Id, 1, "t1", "c1", "SKU-A", "EA", 50);
        InboundDomainTestHelper.BindLineToReceipt(receipt, line);
        receipt.AddLine(line);
        line.Receive(50);

        Assert.Equal(50, line.ReceivedQty);
        Assert.Equal(InboundReceiptLineStatus.Completed, line.Status);
        Assert.Equal(InboundReceiptStatus.Completed, receipt.Status);
    }

    [Fact]
    public void AC020_WhenRejectedQtyPositiveWithoutReason_ThenThrows()
    {
        var receipt = NewReceipt();
        var line = new InboundReceiptLine(receipt.Id, 1, "t1", "c1", "SKU-A", "EA", 10);
        InboundDomainTestHelper.BindLineToReceipt(receipt, line);
        receipt.AddLine(line);

        Assert.Throws<ArgumentException>(() => line.Receive(0, 5, rejectionReason: null));
    }

    [Fact]
    public void AC021_WhenRejectedWithReason_ThenPropertiesPersisted()
    {
        var receipt = NewReceipt();
        var line = new InboundReceiptLine(receipt.Id, 1, "t1", "c1", "SKU-A", "EA", 10);
        InboundDomainTestHelper.BindLineToReceipt(receipt, line);
        receipt.AddLine(line);
        line.Receive(0, 5, "carton crushed");

        Assert.Equal(5, line.RejectedQty);
        Assert.Equal("carton crushed", line.RejectionReason);
        Assert.Equal(0, line.ReceivedQty);
    }

    [Fact]
    public void AC030_WhenForceCloseAfterPartial_ThenShortageQtyComputed()
    {
        var receipt = NewReceipt();
        var line = new InboundReceiptLine(receipt.Id, 1, "t1", "c1", "SKU-A", "EA", 100);
        InboundDomainTestHelper.BindLineToReceipt(receipt, line);
        receipt.AddLine(line);
        line.Receive(70, 10, "condemn");

        Assert.Equal(InboundReceiptLineStatus.PartiallyReceived, line.Status);

        line.ForceClose();

        Assert.Equal(100 - 80, line.ShortageQty);
        Assert.Equal(InboundReceiptLineStatus.Completed, line.Status);
    }

    [Fact]
    public void AC031_WhenAlreadyFullyReceived_ThenForceCloseLeavesShortageUnset()
    {
        var receipt = NewReceipt();
        var line = new InboundReceiptLine(receipt.Id, 1, "t1", "c1", "SKU-A", "EA", 50);
        InboundDomainTestHelper.BindLineToReceipt(receipt, line);
        receipt.AddLine(line);
        line.Receive(50);

        Assert.Equal(InboundReceiptLineStatus.Completed, line.Status);
        Assert.Equal(0, line.ShortageQty);

        line.ForceClose();

        Assert.Equal(0, line.ShortageQty);
        Assert.Equal(InboundReceiptLineStatus.Completed, line.Status);
    }

    [Fact]
    public void AC032_WhenPartialWithoutForceClose_ThenStaysPartiallyReceived()
    {
        var receipt = NewReceipt();
        var line = new InboundReceiptLine(receipt.Id, 1, "t1", "c1", "SKU-A", "EA", 100);
        InboundDomainTestHelper.BindLineToReceipt(receipt, line);
        receipt.AddLine(line);
        line.Receive(30);

        Assert.Equal(InboundReceiptLineStatus.PartiallyReceived, line.Status);
        Assert.Equal(0, line.ShortageQty);
    }

    [Fact]
    public void AC040_WhenAllLinesCleanComplete_ThenHeaderCompleted()
    {
        var receipt = NewReceipt();
        var line1 = new InboundReceiptLine(receipt.Id, 1, "t1", "c1", "SKU-A", "EA", 10);
        var line2 = new InboundReceiptLine(receipt.Id, 2, "t1", "c1", "SKU-B", "EA", 20);
        InboundDomainTestHelper.BindLineToReceipt(receipt, line1);
        InboundDomainTestHelper.BindLineToReceipt(receipt, line2);
        receipt.AddLine(line1);
        receipt.AddLine(line2);
        line1.Receive(10);
        line2.Receive(20);

        Assert.All(receipt.Lines, l =>
        {
            Assert.Equal(InboundReceiptLineStatus.Completed, l.Status);
            Assert.Equal(0, l.RejectedQty);
            Assert.Equal(0, l.ShortageQty);
        });
        Assert.Equal(InboundReceiptStatus.Completed, receipt.Status);
    }

    [Fact]
    public void AC041_WhenAnyExceptionQty_ThenHeaderCompletedWithExceptions()
    {
        var receipt = NewReceipt();
        var lineClean = new InboundReceiptLine(receipt.Id, 1, "t1", "c1", "SKU-A", "EA", 10);
        var lineReject = new InboundReceiptLine(receipt.Id, 2, "t1", "c1", "SKU-B", "EA", 10);
        InboundDomainTestHelper.BindLineToReceipt(receipt, lineClean);
        InboundDomainTestHelper.BindLineToReceipt(receipt, lineReject);
        receipt.AddLine(lineClean);
        receipt.AddLine(lineReject);

        lineClean.Receive(10);
        lineReject.Receive(5, 5, "wet");

        Assert.Equal(InboundReceiptStatus.CompletedWithExceptions, receipt.Status);

        var receiptShortageScenario = NewReceipt();
        var lineEarly = new InboundReceiptLine(receiptShortageScenario.Id, 1, "t1", "c1", "SKU-C", "EA", 10);
        InboundDomainTestHelper.BindLineToReceipt(receiptShortageScenario, lineEarly);
        receiptShortageScenario.AddLine(lineEarly);
        lineEarly.Receive(4);
        lineEarly.ForceClose();

        Assert.Equal(InboundReceiptStatus.CompletedWithExceptions, receiptShortageScenario.Status);
    }
}
