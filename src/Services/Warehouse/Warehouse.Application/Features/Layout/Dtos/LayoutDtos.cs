using System;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Layout.Dtos;

public record WarehouseDto(Guid Id, string Code, string Name, string LocationText);
public record BlockDto(Guid Id, Guid WarehouseId, string BlockCode);
public record ZoneDto(Guid Id, Guid BlockId, string ZoneCode, ZoneType ZoneType);
public record BinDto(Guid Id, Guid ZoneId, string BinCode, BinStatus Status, uint Version);
