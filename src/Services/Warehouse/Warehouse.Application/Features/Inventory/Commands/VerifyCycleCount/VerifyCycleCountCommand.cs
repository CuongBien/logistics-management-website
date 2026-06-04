using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Inventory.Commands.VerifyCycleCount;

#region DTOs

/// <summary>
/// Thông tin sản phẩm đã quét
/// </summary>
public record ScannedItemDto(string Sku, int Quantity);

/// <summary>
/// Thông tin chênh lệch kiểm kê
/// </summary>
public record DiscrepancyDto(
    string Sku,
    int ExpectedQty,
    int ActualQty,
    int Variance,
    Guid CountTaskId);

/// <summary>
/// Kết quả xác thực kiểm kê ô kệ
/// </summary>
public record VerifyCycleCountResult(
    Guid BinId,
    string BinCode,
    int TotalSkusChecked,
    int MatchedCount,
    int DiscrepancyCount,
    List<DiscrepancyDto> Discrepancies);

#endregion

/// <summary>
/// Xác thực kiểm kê ô kệ bằng QR - so sánh hàng quét với tồn kho thực tế
/// </summary>
public record VerifyCycleCountCommand(
    string BinCode,
    Guid WarehouseId,
    List<ScannedItemDto> ScannedItems,
    string OperatorId) : IRequest<Result<VerifyCycleCountResult>>;

public sealed class VerifyCycleCountCommandHandler
    : IRequestHandler<VerifyCycleCountCommand, Result<VerifyCycleCountResult>>
{
    private readonly IApplicationDbContext _context;

    public VerifyCycleCountCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<VerifyCycleCountResult>> Handle(
        VerifyCycleCountCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Tìm ô kệ theo mã code
        var bin = await _context.Bins
            .AsNoTracking()
            .FirstOrDefaultAsync(
                b => b.BinCode == request.BinCode
                     && b.WarehouseId == request.WarehouseId
                     && !b.IsDeleted,
                cancellationToken);

        if (bin is null)
            return Result<VerifyCycleCountResult>.Failure(
                new Error("Bin.NotFound", $"Không tìm thấy ô kệ '{request.BinCode}' trong kho."));

        // 2. Lấy tồn kho hiện tại trong ô kệ (expected)
        var dbItems = await _context.InventoryItems
            .AsNoTracking()
            .Where(i => i.BinId == bin.Id)
            .ToListAsync(cancellationToken);

        var expectedBySku = dbItems
            .GroupBy(i => i.Sku)
            .ToDictionary(
                g => g.Key,
                g => g.Sum(i => i.QuantityOnHand));

        var scannedBySku = request.ScannedItems
            .GroupBy(s => s.Sku)
            .ToDictionary(
                g => g.Key,
                g => g.Sum(s => s.Quantity));

        // 3. Tập hợp tất cả SKU (cả expected lẫn scanned)
        var allSkus = expectedBySku.Keys
            .Union(scannedBySku.Keys)
            .Distinct()
            .ToList();

        // Lấy TenantId từ inventory items nếu có, hoặc dùng mặc định
        var tenantId = dbItems.FirstOrDefault()?.TenantId ?? "default";

        var countTasks = new List<CountTask>();
        var discrepancies = new List<DiscrepancyDto>();
        int matchedCount = 0;

        foreach (var sku in allSkus)
        {
            var expectedQty = expectedBySku.GetValueOrDefault(sku, 0);
            var actualQty = scannedBySku.GetValueOrDefault(sku, 0);
            var variance = actualQty - expectedQty;

            // Tạo CountTask cho mỗi SKU
            var countTask = new CountTask(
                tenantId,
                request.WarehouseId,
                bin.Id,
                sku,
                lotNo: null,
                expiryDate: null,
                expectedQty);

            // Gán nhân viên kiểm kê
            countTask.Assign(request.OperatorId);

            // Ghi nhận số lượng đã đếm
            countTask.SubmitCount(actualQty);

            if (variance == 0)
            {
                // Không có chênh lệch -> tự động đánh dấu đã điều chỉnh
                countTask.MarkAdjusted();
                matchedCount++;
            }
            else
            {
                // Có chênh lệch -> để Counted chờ quản lý duyệt
                discrepancies.Add(new DiscrepancyDto(
                    sku,
                    expectedQty,
                    actualQty,
                    variance,
                    countTask.Id));
            }

            countTasks.Add(countTask);
        }

        // 4. Lưu tất cả CountTask
        _context.CountTasks.AddRange(countTasks);
        await _context.SaveChangesAsync(cancellationToken);

        var result = new VerifyCycleCountResult(
            bin.Id,
            bin.BinCode,
            TotalSkusChecked: allSkus.Count,
            MatchedCount: matchedCount,
            DiscrepancyCount: discrepancies.Count,
            Discrepancies: discrepancies);

        return Result<VerifyCycleCountResult>.Success(result);
    }
}
