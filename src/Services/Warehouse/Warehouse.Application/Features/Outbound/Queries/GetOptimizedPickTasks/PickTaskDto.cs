using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Outbound.Queries.GetOptimizedPickTasks;

public record PickTaskDto(
    Guid TaskId,
    string? OrderNo,
    string? Sku,
    int Quantity,
    string BinCode,
    string? Aisle,
    string? Rack,
    string? Shelf,
    int PickSequence,
    PickTaskStatus Status
);
