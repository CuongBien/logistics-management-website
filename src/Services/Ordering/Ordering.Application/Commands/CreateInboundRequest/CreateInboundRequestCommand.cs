using Logistics.Core;
using MediatR;
using System;
using System.Collections.Generic;

namespace Ordering.Application.Commands.CreateInboundRequest;

public record CreateInboundRequestCommand(
    string DestinationWarehouseCode,  // Mã kho nhận (ví dụ: "WH-CT-001")
    List<InboundItemDto> Items,       // Danh sách SKU + Số lượng
    string? Note,
    string TenantId = "",
    string ConsignorId = ""
) : IRequest<Result<Guid>>;

public record InboundItemDto(string SkuCode, int Quantity);
