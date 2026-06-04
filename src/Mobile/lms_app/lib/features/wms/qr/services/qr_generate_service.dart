import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/error/app_exception.dart';

class QrGenerateService {
  final ApiClient _apiClient;

  QrGenerateService(this._apiClient);

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

  /// A1: Sinh QR cho ô kệ (returns PNG bytes)
  Future<List<int>> generateBinQr({required String binId}) async {
    try {
      final response = await _apiClient.dio.get(
        '/qrcode/bin/$binId',
        options: Options(responseType: ResponseType.bytes),
      );
      return response.data as List<int>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// A2: Sinh QR hàng loạt cho tất cả ô kệ trong 1 kho
  Future<List<dynamic>> generateBatchBinQr({required String warehouseId}) async {
    try {
      final response = await _apiClient.dio.get('/qrcode/warehouse/$warehouseId/bins/batch');
      return response.data as List<dynamic>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// A3: Sinh QR cho đơn vận chuyển (returns PNG bytes)
  Future<List<int>> generateOrderQr({required String orderId}) async {
    try {
      final response = await _apiClient.dio.get(
        '/qrcode/order/$orderId',
        options: Options(responseType: ResponseType.bytes),
      );
      return response.data as List<int>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// A4: Sinh QR cho đơn xuất kho WMS (returns PNG bytes)
  Future<List<int>> generateOutboundOrderQr({required String id}) async {
    try {
      final response = await _apiClient.dio.get(
        '/qrcode/outbound-order/$id',
        options: Options(responseType: ResponseType.bytes),
      );
      return response.data as List<int>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// A5: Sinh QR cho lô hàng (returns PNG bytes)
  Future<List<int>> generateShipmentQr({required String shipmentId}) async {
    try {
      final response = await _apiClient.dio.get(
        '/qrcode/shipment/$shipmentId',
        options: Options(responseType: ResponseType.bytes),
      );
      return response.data as List<int>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// A6: Sinh QR cho phiếu nhập (returns PNG bytes)
  Future<List<int>> generateReceiptQr({required String receiptId}) async {
    try {
      final response = await _apiClient.dio.get(
        '/qrcode/receipt/$receiptId',
        options: Options(responseType: ResponseType.bytes),
      );
      return response.data as List<int>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// A7: Sinh QR cho SKU (returns PNG bytes)
  Future<List<int>> generateSkuQr({required String skuCode}) async {
    try {
      final response = await _apiClient.dio.get(
        '/qrcode/sku/$skuCode',
        options: Options(responseType: ResponseType.bytes),
      );
      return response.data as List<int>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }
}
