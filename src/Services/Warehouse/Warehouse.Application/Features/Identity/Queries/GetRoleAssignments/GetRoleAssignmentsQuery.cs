using System;
using System.Collections.Generic;
using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Identity.Queries.GetRoleAssignments;

public record RoleAssignmentDto(
    Guid Id,
    string OperatorSub,
    string WarehouseId,
    string WarehouseName,
    string RoleName,
    string RoleCode,
    string? FullName = null,
    string? Email = null,
    string? Phone = null,
    string? EmployeeCode = null);

public record GetRoleAssignmentsQuery(string? OperatorSub = null) : IRequest<Result<List<RoleAssignmentDto>>>;
