using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Inventory.Commands.ReserveStock;

public sealed record ReserveStockCommand(string Sku, int Quantity) : IRequest<Result<bool>>;
