import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';

class InventoryRepository {
  final ApiClient _apiClient;

  InventoryRepository(this._apiClient);

  Future<Map<String, dynamic>?> getInventoryBySku(String sku) async {
    try {
      final response = await _apiClient.dio.get('/inventory/by-sku/$sku');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        return null;
      }
      throw Exception(e.response?.data['Message'] ?? 'Lỗi kết nối API tra cứu tồn kho');
    }
  }

  Future<bool> reconcileCycleCount({
    required String warehouseId,
    required String sku,
    required String binCode,
    required int countedQuantity,
    String? reason,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/inventory/reconcile',
        data: {
          'WarehouseId': warehouseId,
          'Sku': sku,
          'BinCode': binCode,
          'CountedQuantity': countedQuantity,
          'Reason': reason ?? 'PDA Cycle Count',
        },
      );
      return response.statusCode == 200;
    } on DioException catch (e) {
      throw Exception(e.response?.data['Message'] ?? 'Lỗi cập nhật số đếm kiểm kê');
    }
  }

  Future<Map<String, dynamic>> getWarehouseHierarchy(String warehouseId) async {
    try {
      final response = await _apiClient.dio.get('/Warehouse/$warehouseId/hierarchy');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(e.response?.data['Message'] ?? 'Lỗi tải sơ đồ cấu trúc kho');
    }
  }
}
