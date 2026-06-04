using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Outbound.Queries.ScanAndLocateOrder;

/// <summary>
/// Thông tin vị trí kiện hàng trong kho sau khi quét mã QR
/// </summary>
public record BinLocationDto(
    Guid BinId,
    string BinCode,
    string Status,
    string? Aisle,
    string? Rack,
    string? Shelf,
    string? ZoneType);

public record OrderLocationResult(
    Guid OrderId,
    string OrderNo,
    string OrderStatus,
    Guid WarehouseId,
    List<BinLocationDto> BinLocations,
    string Message);

/// <summary>
/// Query: Quét mã QR đơn hàng → Tìm tất cả vị trí ô kệ đang chứa đơn hàng này trong kho
/// </summary>
public record ScanAndLocateOrderQuery(string OrderNo) : IRequest<Result<OrderLocationResult>>;

public sealed class ScanAndLocateOrderQueryHandler
    : IRequestHandler<ScanAndLocateOrderQuery, Result<OrderLocationResult>>
{
    private readonly IApplicationDbContext _context;

    public ScanAndLocateOrderQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<OrderLocationResult>> Handle(
        ScanAndLocateOrderQuery request,
        CancellationToken cancellationToken)
    {
        // 1. Tìm đơn hàng xuất kho theo mã OrderNo
        var order = await _context.OutboundOrders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.OrderNo == request.OrderNo, cancellationToken);

        if (order == null)
        {
            return Result<OrderLocationResult>.Failure(
                new Error("Order.NotFound",
                    $"Không tìm thấy đơn hàng với mã '{request.OrderNo}'."));
        }

        // 2. Tìm tất cả ô kệ đang chứa đơn hàng này
        var bins = await _context.Bins
            .Include(b => b.Zone)
            .Where(b => b.CurrentOrderId == order.Id && b.WarehouseId == order.WarehouseId)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var binLocations = bins.Select(b => new BinLocationDto(
            b.Id,
            b.BinCode,
            b.Status,
            b.Aisle,
            b.Rack,
            b.Shelf,
            b.Zone?.ZoneType.ToString()
        )).ToList();

        string message = binLocations.Count > 0
            ? $"Tìm thấy {binLocations.Count} vị trí chứa đơn hàng '{request.OrderNo}'."
            : $"Đơn hàng '{request.OrderNo}' hiện không được gán vào ô kệ nào trong kho.";

        return Result<OrderLocationResult>.Success(new OrderLocationResult(
            order.Id,
            order.OrderNo,
            order.Status.ToString(),
            order.WarehouseId,
            binLocations,
            message));
    }
}
