using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Dashboard.Queries.GetTopMovingSkus;

public record GetTopMovingSkusQuery(Guid? WarehouseId = null) : IRequest<Result<List<TopMovingSkuDto>>>;

public record TopMovingSkuDto(
    string SkuId,
    int TotalMovement
);
