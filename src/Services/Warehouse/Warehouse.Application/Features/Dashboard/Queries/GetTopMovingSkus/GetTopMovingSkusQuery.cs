using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Dashboard.Queries.GetTopMovingSkus;

public record GetTopMovingSkusQuery() : IRequest<Result<List<TopMovingSkuDto>>>;

public record TopMovingSkuDto(
    string SkuId,
    int TotalMovement
);
