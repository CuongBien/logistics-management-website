namespace Warehouse.Application.Common;

/// <summary>
/// Chuẩn hoá format mã QR cho toàn bộ hệ thống LMS.
/// Format: PREFIX:value (ví dụ: BIN:A-03-02, ORD:LMS2506031234)
/// </summary>
public static class QrPayloadFormat
{
    // ── Prefixes ────────────────────────────────────────────────
    public const string Bin = "BIN";
    public const string Order = "ORD";           // Đơn vận chuyển (courier, waybillCode)
    public const string OutboundOrder = "OB";     // Đơn xuất kho (WMS, orderNo)
    public const string Shipment = "SHP";         // Lô hàng
    public const string Sku = "SKU";              // Sản phẩm
    public const string Receipt = "RCV";          // Phiếu nhập

    // ── Encode (Sinh chuỗi QR) ──────────────────────────────────
    public static string ForBin(string binCode) => $"{Bin}:{binCode}";
    public static string ForOrder(string waybillCode) => $"{Order}:{waybillCode}";
    public static string ForOutboundOrder(string orderNo) => $"{OutboundOrder}:{orderNo}";
    public static string ForShipment(string shipmentNo) => $"{Shipment}:{shipmentNo}";
    public static string ForSku(string skuCode) => $"{Sku}:{skuCode}";
    public static string ForReceipt(string receiptNo) => $"{Receipt}:{receiptNo}";

    // ── Decode (Parse chuỗi QR) ─────────────────────────────────
    public static QrParseResult Parse(string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
            return QrParseResult.Unknown(rawValue);

        var colonIndex = rawValue.IndexOf(':');
        if (colonIndex <= 0 || colonIndex >= rawValue.Length - 1)
        {
            var trimmed = rawValue.Trim();
            if (trimmed.StartsWith("LMS", System.StringComparison.OrdinalIgnoreCase))
            {
                return new QrParseResult(OutboundOrder, trimmed, rawValue);
            }
            // Không có prefix → có thể là barcode nhà cung cấp → fallback SKU
            return new QrParseResult(Sku, trimmed, rawValue);
        }

        var prefix = rawValue[..colonIndex].Trim().ToUpperInvariant();
        var value = rawValue[(colonIndex + 1)..].Trim();

        if (string.IsNullOrWhiteSpace(value))
            return QrParseResult.Unknown(rawValue);

        return prefix switch
        {
            Bin => new QrParseResult(Bin, value, rawValue),
            Order or "ORD" => new QrParseResult(Order, value, rawValue),
            OutboundOrder or "OB" => new QrParseResult(OutboundOrder, value, rawValue),
            Shipment or "SHP" => new QrParseResult(Shipment, value, rawValue),
            Sku or "SKU" => new QrParseResult(Sku, value, rawValue),
            Receipt or "RCV" => new QrParseResult(Receipt, value, rawValue),
            _ => QrParseResult.Unknown(rawValue)
        };
    }
}

/// <summary>
/// Kết quả parse mã QR.
/// </summary>
public record QrParseResult(string Type, string Value, string? RawValue)
{
    public bool IsValid => Type != "UNKNOWN";

    public static QrParseResult Unknown(string? rawValue)
        => new("UNKNOWN", string.Empty, rawValue);
}
