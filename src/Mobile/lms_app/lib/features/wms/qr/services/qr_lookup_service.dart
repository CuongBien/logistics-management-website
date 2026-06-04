import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/error/app_exception.dart';
import '../domain/qr_models.dart';

class QrLookupService {
  final ApiClient _apiClient;

  QrLookupService(this._apiClient);

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

  /// B1: Parse mã QR -> Nhận chuỗi thô, trả về type + data enriched
  Future<QrParseResult> parse({
    required String rawValue,
    String? warehouseId,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/qrcode/parse',
        data: {
          'rawValue': rawValue,
          if (warehouseId != null) 'warehouseId': warehouseId,
        },
      );
      return QrParseResult.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// B2: Tra cứu chi tiết ô kệ
  Future<Map<String, dynamic>> lookupBin({required String binId}) async {
    try {
      final response = await _apiClient.dio.get('/qrcode/lookup/bin/$binId');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// B3: Tra cứu đơn hàng
  Future<Map<String, dynamic>> lookupOrder({required String orderId}) async {
    try {
      final response = await _apiClient.dio.get('/qrcode/lookup/order/$orderId');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// B4: Tra cứu lô hàng
  Future<Map<String, dynamic>> lookupShipment({required String shipmentId}) async {
    try {
      final response = await _apiClient.dio.get('/qrcode/lookup/shipment/$shipmentId');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// B5: Tra cứu tồn kho theo SKU
  Future<Map<String, dynamic>> lookupSku({required String skuCode}) async {
    try {
      final response = await _apiClient.dio.get('/qrcode/lookup/sku/$skuCode');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }
}
