using System;
using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Identity.Commands.UnassignRole;

public record UnassignRoleCommand(Guid AssignmentId) : IRequest<Result<bool>>;
