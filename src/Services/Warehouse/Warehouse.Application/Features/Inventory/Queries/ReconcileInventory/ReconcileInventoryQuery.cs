using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Inventory.Queries.ReconcileInventory;

public sealed record ReconcileInventoryQuery(int Days = 7) : IRequest<bool>;
