/// Các model miền (domain) cho tích hợp QR/barcode trong WMS.
/// Bao gồm kết quả quét, phản hồi từ API cho các quy trình:
/// nhận hàng, xác minh đóng gói, phân loại, chất hàng, và nhận chuyển kho.

/// Loại mã QR được nhận diện từ nội dung quét
enum QrType {
  bin,
  order,
  outboundOrder,
  shipment,
  sku,
  receipt,
  unknown,
}

/// Kết quả phân tích nội dung mã QR
class QrParseResult {
  final QrType type;
  final String? entityId;
  final Map<String, dynamic>? data;
  final String? message;

  const QrParseResult({
    required this.type,
    this.entityId,
    this.data,
    this.message,
  });

  factory QrParseResult.fromJson(Map<String, dynamic> json) {
    return QrParseResult(
      type: _parseQrType(json['type'] as String?),
      entityId: json['entityId'] as String?,
      data: json['data'] as Map<String, dynamic>?,
      message: json['message'] as String?,
    );
  }

  /// Trả về QrParseResult khi không nhận diện được mã QR
  factory QrParseResult.unknown(String rawValue) {
    return QrParseResult(
      type: QrType.unknown,
      message: 'Không nhận diện được mã QR: $rawValue',
    );
  }

  static QrType _parseQrType(String? value) {
    if (value == null) return QrType.unknown;
    switch (value.toLowerCase()) {
      case 'bin':
        return QrType.bin;
      case 'order':
        return QrType.order;
      case 'outboundorder':
      case 'outbound_order':
        return QrType.outboundOrder;
      case 'shipment':
        return QrType.shipment;
      case 'sku':
        return QrType.sku;
      case 'receipt':
        return QrType.receipt;
      default:
        return QrType.unknown;
    }
  }
}

// ---------------------------------------------------------------------------
// Nhận hàng (Receiving) — Phản hồi khi quét mã để nhận hàng vào kho
// ---------------------------------------------------------------------------

/// Phản hồi từ API khi quét nhận hàng
class ScanReceiveResponse {
  final bool success;
  final String receiptStatus;
  final LineProgress? lineProgress;
  final String binCode;
  final ScanAlerts? alerts;
  final PutawaySuggestion? suggestion;

  const ScanReceiveResponse({
    required this.success,
    required this.receiptStatus,
    this.lineProgress,
    required this.binCode,
    this.alerts,
    this.suggestion,
  });

  factory ScanReceiveResponse.fromJson(Map<String, dynamic> json) {
    return ScanReceiveResponse(
      success: json['success'] as bool? ?? false,
      receiptStatus: json['receiptStatus'] as String? ?? '',
      lineProgress: json['lineProgress'] != null
          ? LineProgress.fromJson(json['lineProgress'] as Map<String, dynamic>)
          : null,
      binCode: json['binCode'] as String? ?? '',
      alerts: json['alerts'] != null
          ? ScanAlerts.fromJson(json['alerts'] as Map<String, dynamic>)
          : null,
      suggestion: json['suggestion'] != null
          ? PutawaySuggestion.fromJson(
              json['suggestion'] as Map<String, dynamic>)
          : null,
    );
  }
}

/// Tiến độ nhận hàng theo dòng (line) — bao nhiêu đã nhận / cần nhận
class LineProgress {
  final String sku;
  final int expected;
  final int received;

  const LineProgress({
    required this.sku,
    required this.expected,
    required this.received,
  });

  /// Phần trăm hoàn thành (0.0 - 1.0)
  double get percentage => expected > 0 ? received / expected : 0.0;

  factory LineProgress.fromJson(Map<String, dynamic> json) {
    return LineProgress(
      sku: json['sku'] as String? ?? '',
      expected: json['expected'] as int? ?? 0,
      received: json['received'] as int? ?? 0,
    );
  }
}

/// Cảnh báo khi quét nhận hàng (thừa hàng, SKU lạ, cần cách ly)
class ScanAlerts {
  final bool isOverage;
  final bool isUnknownSku;
  final String? quarantineBin;

  const ScanAlerts({
    required this.isOverage,
    required this.isUnknownSku,
    this.quarantineBin,
  });

  factory ScanAlerts.fromJson(Map<String, dynamic> json) {
    return ScanAlerts(
      isOverage: json['isOverage'] as bool? ?? false,
      isUnknownSku: json['isUnknownSku'] as bool? ?? false,
      quarantineBin: json['quarantineBin'] as String?,
    );
  }
}

/// Gợi ý lưu kho sau khi nhận hàng (putaway hoặc cross-dock)
class PutawaySuggestion {
  final String type;
  final String? taskId;
  final String? suggestedBinCode;

  const PutawaySuggestion({
    required this.type,
    this.taskId,
    this.suggestedBinCode,
  });

  factory PutawaySuggestion.fromJson(Map<String, dynamic> json) {
    return PutawaySuggestion(
      type: json['type'] as String? ?? '',
      taskId: json['taskId'] as String?,
      suggestedBinCode: json['suggestedBinCode'] as String?,
    );
  }
}

// ---------------------------------------------------------------------------
// Xác minh đóng gói (Pack Verification)
// ---------------------------------------------------------------------------

/// Phản hồi từ API khi quét xác minh đóng gói
class VerifyPackResponse {
  final bool success;
  final String orderNo;
  final List<VerifiedItem> verifiedItems;
  final bool allItemsVerified;
  final List<String> remainingSkus;

  const VerifyPackResponse({
    required this.success,
    required this.orderNo,
    required this.verifiedItems,
    required this.allItemsVerified,
    required this.remainingSkus,
  });

  factory VerifyPackResponse.fromJson(Map<String, dynamic> json) {
    return VerifyPackResponse(
      success: json['success'] as bool? ?? false,
      orderNo: json['orderNo'] as String? ?? '',
      verifiedItems: (json['verifiedItems'] as List<dynamic>?)
              ?.map((e) =>
                  VerifiedItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      allItemsVerified: json['allItemsVerified'] as bool? ?? false,
      remainingSkus: (json['remainingSkus'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
    );
  }
}

/// Thông tin từng mặt hàng đã được xác minh trong đóng gói
class VerifiedItem {
  final String sku;
  final int required;
  final int scanned;
  final bool complete;

  const VerifiedItem({
    required this.sku,
    required this.required,
    required this.scanned,
    required this.complete,
  });

  factory VerifiedItem.fromJson(Map<String, dynamic> json) {
    return VerifiedItem(
      sku: json['sku'] as String? ?? '',
      required: json['required'] as int? ?? 0,
      scanned: json['scanned'] as int? ?? 0,
      complete: json['complete'] as bool? ?? false,
    );
  }
}

// ---------------------------------------------------------------------------
// Phân loại (Sorting) — Quét để phân loại đơn hàng vào lô vận chuyển
// ---------------------------------------------------------------------------

/// Phản hồi từ API khi quét phân loại
class ScanSortResponse {
  final bool success;
  final String orderId;
  final String waybillCode;
  final String outboundOrderId;
  final String outboundOrderNo;
  final ShipmentInfo? shipment;
  final RoutingInfo? routing;

  const ScanSortResponse({
    required this.success,
    required this.orderId,
    required this.waybillCode,
    required this.outboundOrderId,
    required this.outboundOrderNo,
    this.shipment,
    this.routing,
  });

  factory ScanSortResponse.fromJson(Map<String, dynamic> json) {
    return ScanSortResponse(
      success: json['success'] as bool? ?? false,
      orderId: json['orderId'] as String? ?? '',
      waybillCode: json['waybillCode'] as String? ?? '',
      outboundOrderId: json['outboundOrderId'] as String? ?? '',
      outboundOrderNo: json['outboundOrderNo'] as String? ?? '',
      shipment: json['shipment'] != null
          ? ShipmentInfo.fromJson(json['shipment'] as Map<String, dynamic>)
          : null,
      routing: json['routing'] != null
          ? RoutingInfo.fromJson(json['routing'] as Map<String, dynamic>)
          : null,
    );
  }
}

/// Thông tin lô vận chuyển (shipment) liên quan đến đơn hàng đang phân loại
class ShipmentInfo {
  final String shipmentId;
  final String shipmentNo;
  final String status;
  final int currentOrderCount;
  final DestinationInfo? destination;

  const ShipmentInfo({
    required this.shipmentId,
    required this.shipmentNo,
    required this.status,
    required this.currentOrderCount,
    this.destination,
  });

  factory ShipmentInfo.fromJson(Map<String, dynamic> json) {
    return ShipmentInfo(
      shipmentId: json['shipmentId'] as String? ?? '',
      shipmentNo: json['shipmentNo'] as String? ?? '',
      status: json['status'] as String? ?? '',
      currentOrderCount: json['currentOrderCount'] as int? ?? 0,
      destination: json['destination'] != null
          ? DestinationInfo.fromJson(
              json['destination'] as Map<String, dynamic>)
          : null,
    );
  }
}

/// Thông tin kho đích (destination) của lô vận chuyển
class DestinationInfo {
  final String warehouseId;
  final String warehouseName;

  const DestinationInfo({
    required this.warehouseId,
    required this.warehouseName,
  });

  factory DestinationInfo.fromJson(Map<String, dynamic> json) {
    return DestinationInfo(
      warehouseId: json['warehouseId'] as String? ?? '',
      warehouseName: json['warehouseName'] as String? ?? '',
    );
  }
}

/// Thông tin tuyến vận chuyển (routing) cho đơn hàng multi-hop
class RoutingInfo {
  final String? finalDestination;
  final String? nextHop;
  final int totalHops;
  final int currentHop;

  const RoutingInfo({
    this.finalDestination,
    this.nextHop,
    required this.totalHops,
    required this.currentHop,
  });

  factory RoutingInfo.fromJson(Map<String, dynamic> json) {
    return RoutingInfo(
      finalDestination: json['finalDestination'] as String?,
      nextHop: json['nextHop'] as String?,
      totalHops: json['totalHops'] as int? ?? 0,
      currentHop: json['currentHop'] as int? ?? 0,
    );
  }
}

// ---------------------------------------------------------------------------
// Chất hàng lên xe (Loading)
// ---------------------------------------------------------------------------

/// Phản hồi từ API khi quét chất hàng lên xe
class ScanLoadResponse {
  final bool success;
  final String outboundOrderId;
  final String orderNo;
  final String shipmentId;
  final String shipmentNo;
  final LoadProgress loadProgress;
  final String newStatus;

  const ScanLoadResponse({
    required this.success,
    required this.outboundOrderId,
    required this.orderNo,
    required this.shipmentId,
    required this.shipmentNo,
    required this.loadProgress,
    required this.newStatus,
  });

  factory ScanLoadResponse.fromJson(Map<String, dynamic> json) {
    return ScanLoadResponse(
      success: json['success'] as bool? ?? false,
      outboundOrderId: json['outboundOrderId'] as String? ?? '',
      orderNo: json['orderNo'] as String? ?? '',
      shipmentId: json['shipmentId'] as String? ?? '',
      shipmentNo: json['shipmentNo'] as String? ?? '',
      loadProgress: LoadProgress.fromJson(
          json['loadProgress'] as Map<String, dynamic>? ?? {}),
      newStatus: json['newStatus'] as String? ?? '',
    );
  }
}

/// Tiến độ chất hàng — bao nhiêu đơn đã lên xe
class LoadProgress {
  final int totalOrders;
  final int loadedOrders;
  final int remainingOrders;

  const LoadProgress({
    required this.totalOrders,
    required this.loadedOrders,
    required this.remainingOrders,
  });

  /// Phần trăm hoàn thành (0.0 - 1.0)
  double get percentage =>
      totalOrders > 0 ? loadedOrders / totalOrders : 0.0;

  factory LoadProgress.fromJson(Map<String, dynamic> json) {
    return LoadProgress(
      totalOrders: json['totalOrders'] as int? ?? 0,
      loadedOrders: json['loadedOrders'] as int? ?? 0,
      remainingOrders: json['remainingOrders'] as int? ?? 0,
    );
  }
}

// ---------------------------------------------------------------------------
// Nhận chuyển kho (Transit Receiving) — Nhận hàng từ kho khác chuyển đến
// ---------------------------------------------------------------------------

/// Phản hồi từ API khi quét nhận hàng chuyển kho
class TransitReceiveResponse {
  final bool success;
  final String orderId;
  final String waybillCode;
  final bool receiptCreated;
  final bool isFinalDestination;
  final String nextAction;
  final TransitDiscrepancy? discrepancy;

  const TransitReceiveResponse({
    required this.success,
    required this.orderId,
    required this.waybillCode,
    required this.receiptCreated,
    required this.isFinalDestination,
    required this.nextAction,
    this.discrepancy,
  });

  factory TransitReceiveResponse.fromJson(Map<String, dynamic> json) {
    return TransitReceiveResponse(
      success: json['success'] as bool? ?? false,
      orderId: json['orderId'] as String? ?? '',
      waybillCode: json['waybillCode'] as String? ?? '',
      receiptCreated: json['receiptCreated'] as bool? ?? false,
      isFinalDestination: json['isFinalDestination'] as bool? ?? false,
      nextAction: json['nextAction'] as String? ?? '',
      discrepancy: json['discrepancy'] != null
          ? TransitDiscrepancy.fromJson(
              json['discrepancy'] as Map<String, dynamic>)
          : null,
    );
  }
}

/// Thông tin chênh lệch khi nhận hàng chuyển kho (thiếu/thừa)
class TransitDiscrepancy {
  final bool hasDiscrepancy;
  final List<DiscrepancyItem> items;
  final String? discrepancyId;

  const TransitDiscrepancy({
    required this.hasDiscrepancy,
    required this.items,
    this.discrepancyId,
  });

  factory TransitDiscrepancy.fromJson(Map<String, dynamic> json) {
    return TransitDiscrepancy(
      hasDiscrepancy: json['hasDiscrepancy'] as bool? ?? false,
      items: (json['items'] as List<dynamic>?)
              ?.map(
                  (e) => DiscrepancyItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      discrepancyId: json['discrepancyId'] as String?,
    );
  }
}

/// Chi tiết chênh lệch từng mặt hàng khi nhận chuyển kho
class DiscrepancyItem {
  final String sku;
  final int shipped;
  final int received;
  final int shortage;

  const DiscrepancyItem({
    required this.sku,
    required this.shipped,
    required this.received,
    required this.shortage,
  });

  factory DiscrepancyItem.fromJson(Map<String, dynamic> json) {
    return DiscrepancyItem(
      sku: json['sku'] as String? ?? '',
      shipped: json['shipped'] as int? ?? 0,
      received: json['received'] as int? ?? 0,
      shortage: json['shortage'] as int? ?? 0,
    );
  }
}
