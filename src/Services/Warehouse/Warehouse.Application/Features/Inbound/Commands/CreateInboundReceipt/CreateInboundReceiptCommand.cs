using System;
using System.Collections.Generic;
using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Inbound.Commands.CreateInboundReceipt;

public sealed record CreateInboundReceiptCommand(IReadOnlyCollection<Guid> OrderIds) : IRequest<Result<Guid>>;