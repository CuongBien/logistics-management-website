using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Outbound.Commands.ShipAndReleaseBin;

/// <summary>
/// Kết quả sau khi xuất hàng và giải phóng ô kệ
/// </summary>
public record ShipAndReleaseBinResult(
    Guid OrderId,
    string OrderNo,
    string NewStatus,
    List<string> ReleasedBinCodes,
    string Message);

/// <summary>
/// Command: Quét mã QR nhãn vận chuyển → Giải phóng ô kệ phân loại và đánh dấu đơn hàng đã xuất kho
/// </summary>
public record ShipAndReleaseBinCommand(
    string OrderNo,
    string OperatorId) : IRequest<Result<ShipAndReleaseBinResult>>;

public sealed class ShipAndReleaseBinCommandHandler
    : IRequestHandler<ShipAndReleaseBinCommand, Result<ShipAndReleaseBinResult>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<ShipAndReleaseBinCommandHandler> _logger;

    public ShipAndReleaseBinCommandHandler(
        IApplicationDbContext context,
        ILogger<ShipAndReleaseBinCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Result<ShipAndReleaseBinResult>> Handle(
        ShipAndReleaseBinCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Tìm đơn hàng xuất kho theo mã OrderNo
        var order = await _context.OutboundOrders
            .FirstOrDefaultAsync(o => o.OrderNo == request.OrderNo, cancellationToken);

        if (order == null)
        {
            return Result<ShipAndReleaseBinResult>.Failure(
                new Error("Order.NotFound",
                    $"Không tìm thấy đơn hàng xuất kho với mã '{request.OrderNo}'."));
        }

        // 2. Kiểm tra trạng thái đơn hàng - chỉ cho phép xuất khi đã Packed hoặc Loaded
        if (order.Status != OutboundOrderStatus.Packed &&
            order.Status != OutboundOrderStatus.Loaded)
        {
            return Result<ShipAndReleaseBinResult>.Failure(
                new Error("Order.InvalidStatus",
                    $"Đơn hàng '{request.OrderNo}' đang ở trạng thái '{order.Status}'. " +
                    $"Chỉ cho phép xuất kho khi trạng thái là 'Packed' hoặc 'Loaded'."));
        }

        // 3. Tìm tất cả ô kệ đang giữ đơn hàng này (có thể nhiều ô nếu đơn hàng lớn)
        var assignedBins = await _context.Bins
            .Where(b => b.CurrentOrderId == order.Id && b.WarehouseId == order.WarehouseId)
            .ToListAsync(cancellationToken);

        var releasedBinCodes = new List<string>();

        // 4. Giải phóng từng ô kệ về trạng thái Available
        foreach (var bin in assignedBins)
        {
            _logger.LogInformation(
                "Giải phóng ô kệ {BinCode} (ID: {BinId}) - Đơn hàng {OrderNo} xuất kho bởi {OperatorId}",
                bin.BinCode, bin.Id, request.OrderNo, request.OperatorId);

            bin.Release(); // Chuyển Status → Available, xóa CurrentOrderId
            releasedBinCodes.Add(bin.BinCode);
        }

        // 5. Chuyển trạng thái đơn hàng sang Shipped
        try
        {
            order.UpdateStatus(OutboundOrderStatus.Shipped);
        }
        catch (InvalidOperationException ex)
        {
            return Result<ShipAndReleaseBinResult>.Failure(
                new Error("Order.TransitionFailed", ex.Message));
        }

        // 6. Lưu thay đổi vào Database
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Đơn hàng {OrderNo} đã xuất kho thành công. Giải phóng {Count} ô kệ: [{Bins}]",
            request.OrderNo, releasedBinCodes.Count, string.Join(", ", releasedBinCodes));

        return Result<ShipAndReleaseBinResult>.Success(new ShipAndReleaseBinResult(
            order.Id,
            order.OrderNo,
            order.Status.ToString(),
            releasedBinCodes,
            $"Xuất kho thành công. Đã giải phóng {releasedBinCodes.Count} ô kệ."));
    }
}
