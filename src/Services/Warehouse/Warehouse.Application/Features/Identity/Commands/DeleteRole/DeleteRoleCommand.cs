using System;
using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Identity.Commands.DeleteRole;

public record DeleteRoleCommand(Guid RoleId) : IRequest<Result<bool>>;
