/// Các model miền (domain) cho quy trình nhập kho (inbound).
/// Bao gồm: phiếu nhận hàng, dòng phiếu, nhiệm vụ lưu kho (putaway),
/// và báo cáo chênh lệch khi nhận chuyển kho.

/// Trạng thái phiếu nhận hàng
enum ReceiptStatus {
  pending,
  receiving,
  partiallyReceived,
  completed,
  closedWithDiscrepancy,
}

/// Phân tích trạng thái phiếu nhận hàng từ chuỗi JSON
ReceiptStatus _parseReceiptStatus(String? value) {
  if (value == null) return ReceiptStatus.pending;
  switch (value.toLowerCase()) {
    case 'pending':
      return ReceiptStatus.pending;
    case 'receiving':
      return ReceiptStatus.receiving;
    case 'partiallyreceived':
    case 'partially_received':
      return ReceiptStatus.partiallyReceived;
    case 'completed':
      return ReceiptStatus.completed;
    case 'closedwithdiscrepancy':
    case 'closed_with_discrepancy':
      return ReceiptStatus.closedWithDiscrepancy;
    default:
      return ReceiptStatus.pending;
  }
}

/// Phiếu nhận hàng (inbound receipt) — theo dõi việc nhận hàng vào kho
class InboundReceipt {
  final String id;
  final String receiptNo;
  final String? orderId;
  final ReceiptStatus status;
  final String warehouseId;
  final List<ReceiptLine> lines;
  final DateTime createdAt;

  const InboundReceipt({
    required this.id,
    required this.receiptNo,
    this.orderId,
    required this.status,
    required this.warehouseId,
    required this.lines,
    required this.createdAt,
  });

  factory InboundReceipt.fromJson(Map<String, dynamic> json) {
    return InboundReceipt(
      id: json['id'] as String? ?? '',
      receiptNo: json['receiptNo'] as String? ?? '',
      orderId: json['orderId'] as String?,
      status: _parseReceiptStatus(json['status'] as String?),
      warehouseId: json['warehouseId'] as String? ?? '',
      lines: (json['lines'] as List<dynamic>?)
              ?.map(
                  (e) => ReceiptLine.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }

  /// Phần trăm hàng đã nhận trên tổng số cần nhận (0.0 - 1.0)
  double get receivedPercentage {
    if (lines.isEmpty) return 0.0;
    final totalExpected =
        lines.fold<int>(0, (sum, line) => sum + line.expectedQty);
    if (totalExpected == 0) return 0.0;
    final totalReceived =
        lines.fold<int>(0, (sum, line) => sum + line.receivedQty);
    return totalReceived / totalExpected;
  }
}

/// Dòng chi tiết trong phiếu nhận hàng
class ReceiptLine {
  final String id;
  final String skuCode;
  final String? skuName;
  final int expectedQty;
  final int receivedQty;

  const ReceiptLine({
    required this.id,
    required this.skuCode,
    this.skuName,
    required this.expectedQty,
    required this.receivedQty,
  });

  factory ReceiptLine.fromJson(Map<String, dynamic> json) {
    return ReceiptLine(
      id: json['id'] as String? ?? '',
      skuCode: json['skuCode'] as String? ?? '',
      skuName: json['skuName'] as String?,
      expectedQty: json['expectedQty'] as int? ?? 0,
      receivedQty: json['receivedQty'] as int? ?? 0,
    );
  }

  /// Kiểm tra dòng đã nhận đủ số lượng chưa
  bool get isComplete => receivedQty >= expectedQty;
}

/// Nhiệm vụ lưu kho (putaway task) — di chuyển hàng từ khu nhận vào bin lưu trữ
class PutawayTask {
  final String id;
  final String receiptId;
  final String skuCode;
  final String? sourceBinCode;
  final String targetBinCode;
  final int quantity;
  final String status;

  const PutawayTask({
    required this.id,
    required this.receiptId,
    required this.skuCode,
    this.sourceBinCode,
    required this.targetBinCode,
    required this.quantity,
    required this.status,
  });

  factory PutawayTask.fromJson(Map<String, dynamic> json) {
    return PutawayTask(
      id: json['id'] as String? ?? '',
      receiptId: json['receiptId'] as String? ?? '',
      skuCode: json['skuCode'] as String? ?? '',
      sourceBinCode: json['sourceBinCode'] as String?,
      targetBinCode: json['targetBinCode'] as String? ?? '',
      quantity: json['quantity'] as int? ?? 0,
      status: json['status'] as String? ?? 'Pending',
    );
  }
}

/// Báo cáo chênh lệch khi nhận hàng chuyển kho (transit discrepancy)
class TransitDiscrepancyReport {
  final String id;
  final String shipmentId;
  final List<DiscrepancyLine> lines;
  final String status;

  const TransitDiscrepancyReport({
    required this.id,
    required this.shipmentId,
    required this.lines,
    required this.status,
  });

  factory TransitDiscrepancyReport.fromJson(Map<String, dynamic> json) {
    return TransitDiscrepancyReport(
      id: json['id'] as String? ?? '',
      shipmentId: json['shipmentId'] as String? ?? '',
      lines: (json['lines'] as List<dynamic>?)
              ?.map((e) =>
                  DiscrepancyLine.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      status: json['status'] as String? ?? 'Pending',
    );
  }
}

/// Dòng chênh lệch — số lượng thực tế so với kỳ vọng cho từng SKU
class DiscrepancyLine {
  final String skuCode;
  final int expectedQty;
  final int actualQty;
  /// Chênh lệch: âm = thiếu hàng (shortage), dương = thừa hàng (overage)
  final int variance;

  const DiscrepancyLine({
    required this.skuCode,
    required this.expectedQty,
    required this.actualQty,
    required this.variance,
  });

  factory DiscrepancyLine.fromJson(Map<String, dynamic> json) {
    return DiscrepancyLine(
      skuCode: json['skuCode'] as String? ?? '',
      expectedQty: json['expectedQty'] as int? ?? 0,
      actualQty: json['actualQty'] as int? ?? 0,
      variance: json['variance'] as int? ?? 0,
    );
  }
}
