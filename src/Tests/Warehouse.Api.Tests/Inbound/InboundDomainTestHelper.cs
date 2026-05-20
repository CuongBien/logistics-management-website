using System.Reflection;
using Warehouse.Domain.Entities;

namespace Warehouse.Api.Tests.Inbound;

internal static class InboundDomainTestHelper
{
    private static readonly PropertyInfo ReceiptNav = typeof(InboundReceiptLine).GetProperty(
        nameof(InboundReceiptLine.Receipt),
        BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)!
        ;

    /// <summary>Domain lines need <see cref="InboundReceiptLine.Receipt"/> set so status rolls up to the header.</summary>
    public static void BindLineToReceipt(InboundReceipt receipt, InboundReceiptLine line)
    {
        ReceiptNav.SetValue(line, receipt);
    }
}
