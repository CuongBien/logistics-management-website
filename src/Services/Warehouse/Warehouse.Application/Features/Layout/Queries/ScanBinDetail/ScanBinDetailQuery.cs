using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Layout.Queries.ScanBinDetail;

#region DTOs

/// <summary>
/// Thông tin chi tiết ô kệ khi quét mã QR
/// </summary>
public record ScanBinDetailResult(
    Guid BinId,
    string BinCode,
    string Status,
    string ZoneType,
    string? Aisle,
    string? Rack,
    string? Shelf,
    Guid? CurrentOrderId,
    List<BinInventoryItemDto> Items);

/// <summary>
/// Thông tin hàng tồn kho trong ô kệ
/// </summary>
public record BinInventoryItemDto(
    string Sku,
    string? LotNo,
    int QuantityOnHand,
    int ReservedQty,
    int AvailableQty);

#endregion

/// <summary>
/// Tra cứu thông tin chi tiết ô kệ qua mã QR
/// </summary>
public record ScanBinDetailQuery(string BinCode, Guid WarehouseId) : IRequest<Result<ScanBinDetailResult>>;

public sealed class ScanBinDetailQueryHandler : IRequestHandler<ScanBinDetailQuery, Result<ScanBinDetailResult>>
{
    private readonly IApplicationDbContext _context;

    public ScanBinDetailQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<ScanBinDetailResult>> Handle(ScanBinDetailQuery request, CancellationToken cancellationToken)
    {
        // Tìm ô kệ theo mã code trong kho
        var bin = await _context.Bins
            .AsNoTracking()
            .Include(b => b.Zone)
            .FirstOrDefaultAsync(
                b => b.BinCode == request.BinCode
                     && b.WarehouseId == request.WarehouseId
                     && !b.IsDeleted,
                cancellationToken);

        if (bin is null)
            return Result<ScanBinDetailResult>.Failure(
                new Error("Bin.NotFound", $"Không tìm thấy ô kệ '{request.BinCode}' trong kho."));

        // Lấy danh sách hàng tồn kho trong ô kệ
        var items = await _context.InventoryItems
            .AsNoTracking()
            .Where(i => i.BinId == bin.Id && i.QuantityOnHand > 0)
            .Select(i => new BinInventoryItemDto(
                i.Sku,
                i.LotNo,
                i.QuantityOnHand,
                i.ReservedQty,
                i.AvailableQty))
            .ToListAsync(cancellationToken);

        var result = new ScanBinDetailResult(
            bin.Id,
            bin.BinCode,
            bin.Status,
            bin.Zone.ZoneType,
            bin.Aisle,
            bin.Rack,
            bin.Shelf,
            bin.CurrentOrderId,
            items);

        return Result<ScanBinDetailResult>.Success(result);
    }
}
