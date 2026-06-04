import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/error/app_exception.dart';
import '../domain/qr_models.dart';

class QrActionService {
  final ApiClient _apiClient;

  QrActionService(this._apiClient);

  AppException _handleDioError(DioException e) {
    final response = e.response;
    if (response != null && response.data is Map<String, dynamic>) {
      final data = response.data as Map<String, dynamic>;
      final errorCode = data['error'] ?? data['Error'];
      final errorMessage = data['message'] ?? data['Message'];
      if (errorCode is String && errorMessage is String) {
        if (errorCode.startsWith('QR.')) {
          return QrException(
            errorMessage,
            code: errorCode,
            statusCode: response.statusCode,
          );
        }
        return AppException(
          errorMessage,
          code: errorCode,
          statusCode: response.statusCode,
        );
      }
    }
    return AppException.fromDioException(e);
  }

  /// C1: Scan SKU + Scan Bin -> Nhận hàng vào phiếu nhập
  Future<ScanReceiveResponse> scanReceive({
    required String receiptId,
    required String scannedSku,
    required String scannedBin,
    required int quantity,
    String? lotNo,
    DateTime? expiryDate,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/qrcode/actions/scan-receive',
        data: {
          'receiptId': receiptId,
          'scannedSku': scannedSku,
          'scannedBin': scannedBin,
          'quantity': quantity,
          if (lotNo != null) 'lotNo': lotNo,
          if (expiryDate != null) 'expiryDate': expiryDate.toIso8601String(),
        },
      );
      return ScanReceiveResponse.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// C2: Scan Bin đích -> Hoàn tất cất hàng (putaway)
  Future<Map<String, dynamic>> confirmPutaway({
    required String taskId,
    required String scannedBin,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/qrcode/actions/confirm-putaway',
        data: {
          'taskId': taskId,
          'scannedBin': scannedBin,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// C3: Scan Bin OUT -> Hoàn tất cross-dock
  Future<Map<String, dynamic>> confirmCrossDock({
    required String taskId,
    required String scannedBin,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/qrcode/actions/confirm-crossdock',
        data: {
          'taskId': taskId,
          'scannedBin': scannedBin,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// C4: Scan kiện -> Nhận hàng trung chuyển (transit receive)
  Future<TransitReceiveResponse> transitReceive({
    required String scannedOrder,
    required String warehouseId,
    String? scannedBin,
    Map<String, int>? receivedItems,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/qrcode/actions/transit-receive',
        data: {
          'scannedOrder': scannedOrder,
          'warehouseId': warehouseId,
          if (scannedBin != null) 'scannedBin': scannedBin,
          if (receivedItems != null) 'receivedItems': receivedItems,
        },
      );
      return TransitReceiveResponse.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// C5: Scan Bin nguồn + SKU -> Hoàn tất lấy hàng (pick)
  Future<Map<String, dynamic>> confirmPick({
    required String pickTaskId,
    required String scannedBin,
    required String scannedSku,
    int? quantity,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/qrcode/actions/confirm-pick',
        data: {
          'pickTaskId': pickTaskId,
          'scannedBin': scannedBin,
          'scannedSku': scannedSku,
          if (quantity != null) 'quantity': quantity,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// C6: Scan SKU -> Xác nhận đúng sản phẩm khi đóng gói (verify-pack)
  Future<VerifyPackResponse> verifyPack({
    required String outboundOrderId,
    required String scannedSku,
    required int quantity,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/qrcode/actions/verify-pack',
        data: {
          'outboundOrderId': outboundOrderId,
          'scannedSku': scannedSku,
          'quantity': quantity,
        },
      );
      return VerifyPackResponse.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// C7: Scan kiện courier -> Sort + gom vào Shipment
  Future<ScanSortResponse> scanSort({
    required String scannedOrder,
    String? destinationWarehouseId,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/qrcode/actions/scan-sort',
        data: {
          'scannedOrder': scannedOrder,
          if (destinationWarehouseId != null) 'destinationWarehouseId': destinationWarehouseId,
        },
      );
      return ScanSortResponse.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// C8: Scan thùng -> Xác nhận đã chất lên xe (load vào Shipment)
  Future<ScanLoadResponse> scanLoad({
    required String scannedOrder,
    String? shipmentId,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/qrcode/actions/scan-load',
        data: {
          'scannedOrder': scannedOrder,
          if (shipmentId != null) 'shipmentId': shipmentId,
        },
      );
      return ScanLoadResponse.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// C9: Scan thùng -> Ship + giải phóng ô kệ (1 bước)
  Future<Map<String, dynamic>> shipAndRelease({
    required String scannedOrder,
    String? shipmentId,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/qrcode/actions/ship-and-release',
        data: {
          'scannedOrder': scannedOrder,
          if (shipmentId != null) 'shipmentId': shipmentId,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// C10: Scan Bin -> Xác nhận đúng kệ cần kiểm kê
  Future<Map<String, dynamic>> cycleCountStart({
    required String countTaskId,
    required String scannedBin,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/qrcode/actions/cycle-count-start',
        data: {
          'countTaskId': countTaskId,
          'scannedBin': scannedBin,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// C11: Scan Bin nguồn + Bin đích -> Hoàn tất bổ sung hàng (replenish)
  Future<Map<String, dynamic>> confirmReplenish({
    required String taskId,
    required String scannedSourceBin,
    required String scannedDestBin,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/qrcode/actions/confirm-replenish',
        data: {
          'taskId': taskId,
          'scannedSourceBin': scannedSourceBin,
          'scannedDestBin': scannedDestBin,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }
}
