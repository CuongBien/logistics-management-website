using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Inventory.Commands.CreateInventoryItem;

public sealed record CreateInventoryItemCommand(string Sku, int Quantity) : IRequest<Result<Guid>>;
