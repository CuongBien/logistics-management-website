import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';

class InboundRepository {
  final ApiClient _apiClient;

  InboundRepository(this._apiClient);

  Future<Map<String, dynamic>> receiveItem({
    required String receiptId,
    required String orderId,
    required String skuCode,
    required String binCode,
    required int quantity,
  }) async {
    try {
      final response = await _apiClient.dio.put(
        '/inbound/receipts/$receiptId/receive',
        data: {
          'orderId': orderId,
          'skuCode': skuCode,
          'binCode': binCode,
          'quantity': quantity,
        },
      );
      
      // Trả về toàn bộ data (bao gồm IsPutawaySuggested, PutawayTaskId, SuggestedPutawayBinCode)
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      // Bắt lỗi từ server để báo ra UI (Ví dụ: Sai mã SKU, Phiếu nhập đóng...)
      throw Exception(e.response?.data['Message'] ?? 'Lỗi kết nối API');
    }
  }

  Future<bool> reportDiscrepancy({
    required String discrepancyId,
    required int newStatus, // 2: Resolved, etc.
    required String notes,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/inbound/discrepancies/$discrepancyId/resolve',
        data: {
          'newStatus': newStatus,
          'notes': notes,
        },
      );
      return response.statusCode == 200;
    } on DioException catch (e) {
      throw Exception(e.response?.data['Message'] ?? 'Lỗi kết nối API');
    }
  }

  Future<Map<String, dynamic>> getReceiptByOrderId(String orderId, {String? warehouseId}) async {
    try {
      final response = await _apiClient.dio.get(
        '/inbound/receipts/by-order/$orderId',
        queryParameters: {
          if (warehouseId != null) 'warehouseId': warehouseId,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data['Message'] ?? 'Lỗi tìm phiếu nhập theo Order ID');
    }
  }

  Future<bool> forceCloseReceipt(String receiptId) async {
    try {
      final response = await _apiClient.dio.post('/inbound/receipts/$receiptId/force-close');
      return response.statusCode == 200;
    } on DioException catch (e) {
      throw Exception(e.response?.data['Message'] ?? 'Lỗi đóng cưỡng chế phiếu nhập');
    }
  }

  Future<bool> receiveTransitShipment({
    required String orderId,
    required String warehouseId,
    required String binCode,
    required Map<String, int> receivedItems,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/inbound/orders/$orderId/transit-receive',
        data: {
          'warehouseId': warehouseId,
          'binCode': binCode,
          'receivedItems': receivedItems,
        },
      );
      return response.statusCode == 200;
    } on DioException catch (e) {
      throw Exception(e.response?.data['Message'] ?? 'Lỗi nhận hàng luân chuyển');
    }
  }
}
