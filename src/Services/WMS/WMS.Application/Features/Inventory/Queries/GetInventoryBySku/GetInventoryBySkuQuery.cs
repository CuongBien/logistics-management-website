using BuildingBlocks.Domain;
using MediatR;
using WMS.Application.Features.Inventory.Dtos;

namespace WMS.Application.Features.Inventory.Queries.GetInventoryBySku;

public sealed record GetInventoryBySkuQuery(string Sku) : IRequest<Result<InventoryItemDto>>;
