namespace Warehouse.Application.Features.Layout.DTOs;

public record WarehouseDto(Guid Id, string Name, string Code, string LocationText);

public record BlockDto(Guid Id, Guid WarehouseId, string BlockCode);

public record ZoneDto(Guid Id, Guid BlockId, string ZoneType);

public record BinDto(Guid Id, Guid WarehouseId, Guid ZoneId, string BinCode, string Status, string? Aisle = null, string? Rack = null, string? Shelf = null, int PickSequence = 0);

public record WarehouseHierarchyDto(
    Guid Id, 
    string Name, 
    string Code, 
    List<BlockHierarchyDto> Blocks);

public record BlockHierarchyDto(
    Guid Id, 
    string BlockCode, 
    List<ZoneHierarchyDto> Zones);

public record ZoneHierarchyDto(
    Guid Id, 
    string ZoneType, 
    List<BinDto> Bins);
