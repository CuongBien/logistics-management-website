using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Inventory.Commands.CreateInventoryItem;

public sealed record CreateInventoryItemCommand(string Sku, int Quantity, string? TenantId, string? CustomerId, Guid WarehouseId, Guid BinId) : IRequest<Result<Guid>>;
