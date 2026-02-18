using BuildingBlocks.Domain;
using MediatR;

namespace WMS.Application.Features.Inventory.Commands.CreateInventoryItem;

public sealed record CreateInventoryItemCommand(string Sku, int Quantity) : IRequest<Result<Guid>>;
