using BuildingBlocks.Domain;
using MediatR;

namespace WMS.Application.Features.Inventory.Commands.ReserveStock;

public sealed record ReserveStockCommand(string Sku, int Quantity) : IRequest<Result<bool>>;
