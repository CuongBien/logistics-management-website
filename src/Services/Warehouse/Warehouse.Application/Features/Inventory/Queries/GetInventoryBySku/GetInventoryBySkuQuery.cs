using Logistics.Core;
using MediatR;
using Warehouse.Application.Features.Inventory.Dtos;

namespace Warehouse.Application.Features.Inventory.Queries.GetInventoryBySku;

public sealed record GetInventoryBySkuQuery(string Sku) : IRequest<Result<InventoryItemDto>>;
