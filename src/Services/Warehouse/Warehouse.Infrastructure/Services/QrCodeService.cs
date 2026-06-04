using QRCoder;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Infrastructure.Services;

public class QrCodeService : IQrCodeService
{
    public byte[] GeneratePng(string payload, int pixelsPerModule = 10)
    {
        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(payload, QRCodeGenerator.ECCLevel.M);
        using var qrCode = new PngByteQRCode(qrCodeData);
        return qrCode.GetGraphic(pixelsPerModule);
    }
}
