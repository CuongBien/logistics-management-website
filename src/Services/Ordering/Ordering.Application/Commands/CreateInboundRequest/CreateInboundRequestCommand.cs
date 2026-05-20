using Logistics.Core;
using MediatR;
using System;
using System.Collections.Generic;

namespace Ordering.Application.Commands.CreateInboundRequest;

public record CreateInboundRequestCommand(
    string DestinationWarehouseCode,  // Mã kho lưu trữ cuối cùng (ví dụ: "WH-HP-007")
    string? SourceWarehouseCode,      // Mã kho/bưu cục nhận hàng ban đầu (ví dụ: "WH-CT-001"). Nếu null, mặc định bằng DestinationWarehouseCode.
    List<InboundItemDto> Items,       // Danh sách SKU + Số lượng
    string? Note,
    string TenantId = "",
    string ConsignorId = ""
) : IRequest<Result<Guid>>;

public record InboundItemDto(string SkuCode, int Quantity);
