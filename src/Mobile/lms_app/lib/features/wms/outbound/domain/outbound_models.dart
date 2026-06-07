/// Các model miền (domain) cho quy trình xuất kho (outbound).
/// Bao gồm: đơn xuất kho, dòng đơn, nhiệm vụ lấy hàng (pick), lô vận chuyển.

/// Trạng thái đơn xuất kho
enum OutboundOrderStatus {
  draft,
  allocated,
  picking,
  picked,
  packed,
  loaded,
  shipped,
  delivered,
  cancelled,
}

/// Phân tích trạng thái từ chuỗi JSON
OutboundOrderStatus _parseOutboundOrderStatus(String? value) {
  if (value == null) return OutboundOrderStatus.draft;
  switch (value.toLowerCase()) {
    case 'draft':
      return OutboundOrderStatus.draft;
    case 'allocated':
      return OutboundOrderStatus.allocated;
    case 'picking':
      return OutboundOrderStatus.picking;
    case 'picked':
      return OutboundOrderStatus.picked;
    case 'packed':
      return OutboundOrderStatus.packed;
    case 'loaded':
      return OutboundOrderStatus.loaded;
    case 'shipped':
      return OutboundOrderStatus.shipped;
    case 'delivered':
      return OutboundOrderStatus.delivered;
    case 'cancelled':
      return OutboundOrderStatus.cancelled;
    default:
      return OutboundOrderStatus.draft;
  }
}

/// Đơn xuất kho (outbound order)
class OutboundOrder {
  final String id;
  final String orderNo;
  final OutboundOrderStatus status;
  final String? warehouseId;
  final String? destinationWarehouseId;
  final String? shipmentId;
  final List<OutboundOrderLine> lines;
  final DateTime createdAt;

  const OutboundOrder({
    required this.id,
    required this.orderNo,
    required this.status,
    this.warehouseId,
    this.destinationWarehouseId,
    this.shipmentId,
    required this.lines,
    required this.createdAt,
  });

  factory OutboundOrder.fromJson(Map<String, dynamic> json) {
    return OutboundOrder(
      id: json['id'] as String? ?? '',
      orderNo: json['orderNo'] as String? ?? '',
      status: _parseOutboundOrderStatus(json['status'] as String?),
      warehouseId: json['warehouseId'] as String?,
      destinationWarehouseId: json['destinationWarehouseId'] as String?,
      shipmentId: json['shipmentId'] as String?,
      lines: (json['lines'] as List<dynamic>?)
              ?.map((e) =>
                  OutboundOrderLine.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }

  /// Nhãn hiển thị trạng thái bằng tiếng Việt
  String get statusDisplay {
    switch (status) {
      case OutboundOrderStatus.draft:
        return 'Nháp';
      case OutboundOrderStatus.allocated:
        return 'Đã phân bổ';
      case OutboundOrderStatus.picking:
        return 'Đang lấy hàng';
      case OutboundOrderStatus.picked:
        return 'Đã lấy hàng';
      case OutboundOrderStatus.packed:
        return 'Đã đóng gói';
      case OutboundOrderStatus.loaded:
        return 'Đã chất lên xe';
      case OutboundOrderStatus.shipped:
        return 'Đã giao vận chuyển';
      case OutboundOrderStatus.delivered:
        return 'Đã giao hàng';
      case OutboundOrderStatus.cancelled:
        return 'Đã hủy';
    }
  }
}

/// Dòng chi tiết trong đơn xuất kho
class OutboundOrderLine {
  final String id;
  final String skuCode;
  final String? skuName;
  final int quantity;
  final int? pickedQty;
  final int? packedQty;

  const OutboundOrderLine({
    required this.id,
    required this.skuCode,
    this.skuName,
    required this.quantity,
    this.pickedQty,
    this.packedQty,
  });

  factory OutboundOrderLine.fromJson(Map<String, dynamic> json) {
    return OutboundOrderLine(
      id: json['id'] as String? ?? '',
      skuCode: json['skuCode'] as String? ?? '',
      skuName: json['skuName'] as String?,
      quantity: json['quantity'] as int? ?? 0,
      pickedQty: json['pickedQty'] as int?,
      packedQty: json['packedQty'] as int?,
    );
  }
}

/// Nhiệm vụ lấy hàng (pick task) — nhân viên kho lấy hàng từ bin
class PickTask {
  final String id;
  final String outboundOrderId;
  final String skuCode;
  final String? skuName;
  final String sourceBinCode;
  final int quantity;
  final String status;

  const PickTask({
    required this.id,
    required this.outboundOrderId,
    required this.skuCode,
    this.skuName,
    required this.sourceBinCode,
    required this.quantity,
    required this.status,
  });

  factory PickTask.fromJson(Map<String, dynamic> json) {
    return PickTask(
      id: json['id'] as String? ?? '',
      outboundOrderId: json['outboundOrderId'] as String? ?? '',
      skuCode: json['skuCode'] as String? ?? '',
      skuName: json['skuName'] as String?,
      sourceBinCode: json['sourceBinCode'] as String? ?? '',
      quantity: json['quantity'] as int? ?? 0,
      status: json['status'] as String? ?? 'Pending',
    );
  }
}

/// Lô vận chuyển (shipment) — gom nhiều đơn xuất kho vào 1 chuyến
class Shipment {
  final String id;
  final String shipmentNo;
  final String status;
  final String? warehouseId;
  final String? destinationId;
  final String? carrier;
  final int orderCount;
  final DateTime? createdAt;
  final DateTime? shippedAt;

  const Shipment({
    required this.id,
    required this.shipmentNo,
    required this.status,
    this.warehouseId,
    this.destinationId,
    this.carrier,
    required this.orderCount,
    this.createdAt,
    this.shippedAt,
  });

  factory Shipment.fromJson(Map<String, dynamic> json) {
    return Shipment(
      id: json['id'] as String? ?? '',
      shipmentNo: json['shipmentNo'] as String? ?? '',
      status: json['status'] as String? ?? '',
      warehouseId: json['warehouseId'] as String?,
      destinationId: json['destinationId'] as String?,
      carrier: json['carrier'] as String?,
      orderCount: json['orderCount'] as int? ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
      shippedAt: json['shippedAt'] != null
          ? DateTime.parse(json['shippedAt'] as String)
          : null,
    );
  }

  /// Nhãn hiển thị trạng thái lô vận chuyển bằng tiếng Việt
  String get statusDisplay {
    switch (status.toLowerCase()) {
      case 'created':
        return 'Đã tạo';
      case 'loading':
        return 'Đang chất hàng';
      case 'loaded':
        return 'Đã chất xong';
      case 'shipped':
      case 'intransit':
      case 'in_transit':
        return 'Đang vận chuyển';
      case 'delivered':
        return 'Đã giao';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  }
}
