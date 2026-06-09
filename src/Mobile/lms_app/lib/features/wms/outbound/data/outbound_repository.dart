import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/error/app_exception.dart';

class OutboundRepository {
  final ApiClient _apiClient;

  OutboundRepository(this._apiClient);

  AppException _handleError(DioException e, String fallbackMessage) {
    try {
      final appEx = AppException.fromDioException(e);
      if (appEx.message.startsWith('Lỗi server:') || appEx.message.startsWith('Đã có lỗi xảy ra')) {
        return AppException(
          fallbackMessage,
          code: appEx.code,
          statusCode: appEx.statusCode,
        );
      }
      return appEx;
    } catch (_) {
      return AppException(fallbackMessage);
    }
  }

  Future<List<dynamic>> getPickTasksForWave(String waveId) async {
    try {
      final response = await _apiClient.dio.get('/outbound/waves/$waveId/pick-tasks');
      // Trả về List các PickTaskDto
      return response.data as List<dynamic>;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        // Fallback: If wave not found, try retrieving by order ID/code
        try {
          return await getPickTasksByOrder(waveId);
        } catch (_) {
          return [];
        }
      }
      throw _handleError(e, 'Lỗi kết nối API lấy danh sách Pick Task');
    }
  }

  Future<bool> confirmPickTask(String taskId) async {
    try {
      final response = await _apiClient.dio.post('/outbound/pick-tasks/$taskId/confirm');
      return response.statusCode == 200;
    } on DioException catch (e) {
      throw _handleError(e, 'Lỗi kết nối API xác nhận Pick');
    }
  }

  Future<Map<String, dynamic>> putToWall(String waveId, String sku) async {
    try {
      final response = await _apiClient.dio.post(
        '/outbound/waves/$waveId/put-to-wall',
        data: {'Sku': sku},
      );
      // Trả về PutToWallResult (chứa TargetBinCode)
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e, 'Lỗi chia chọn Put-to-Wall');
    }
  }

  Future<bool> packOrder(String orderId) async {
    try {
      final response = await _apiClient.dio.post('/outbound/orders/$orderId/pack');
      return response.statusCode == 200;
    } on DioException catch (e) {
      throw _handleError(e, 'Lỗi đóng gói đơn hàng');
    }
  }

  Future<bool> dispatchShipment(String shipmentId) async {
    try {
      final response = await _apiClient.dio.post('/outbound/shipments/$shipmentId/dispatch');
      return response.statusCode == 200;
    } on DioException catch (e) {
      throw _handleError(e, 'Lỗi xuất xe');
    }
  }

  Future<String> createTestOrder({
    required String orderId,
    required String orderNo,
    required String sku,
    required int quantity,
    String? warehouseId,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/outbound/orders',
        data: {
          'tenantId': 'default-tenant',
          'customerId': 'cust-default',
          'warehouseId': warehouseId ?? 'a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
          'orderId': orderId,
          'orderNo': orderNo,
          'destinationAddress': '123 E2E St',
          'destinationCity': 'HCM',
          'priority': 1,
          'allowPartial': true,
          'lines': [
            {
              'sku': sku,
              'quantity': quantity,
              'uom': 'PCS',
            }
          ]
        },
      );
      if (response.data is Map && response.data['value'] != null) {
        return response.data['value'].toString();
      }
      return response.data.toString();
    } on DioException catch (e) {
      throw _handleError(e, 'Lỗi tạo đơn hàng xuất kho');
    }
  }

  Future<bool> allocateStock(String orderId) async {
    try {
      final response = await _apiClient.dio.post('/outbound/orders/$orderId/allocate');
      return response.statusCode == 200;
    } on DioException catch (e) {
      throw _handleError(e, 'Lỗi phân bổ tồn kho');
    }
  }

  Future<bool> pickStock(String orderId) async {
    try {
      final response = await _apiClient.dio.post('/outbound/orders/$orderId/pick');
      return response.statusCode == 200;
    } on DioException catch (e) {
      throw _handleError(e, 'Lỗi kích hoạt lấy hàng');
    }
  }

  Future<Map<String, dynamic>> autoPlanWaves({String? warehouseId}) async {
    try {
      final response = await _apiClient.dio.post(
        '/outbound/waves/auto-plan',
        data: {
          'warehouseId': warehouseId ?? 'a3a1a1a1-a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
          'maxSingleItemOrdersPerWave': 50,
          'maxMultiItemOrdersPerWave': 20,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e, 'Lỗi chạy công cụ Auto-Plan Waves');
    }
  }

  Future<bool> shipOrder(String orderId) async {
    try {
      final response = await _apiClient.dio.post('/outbound/orders/$orderId/ship');
      return response.statusCode == 200;
    } on DioException catch (e) {
      throw _handleError(e, 'Lỗi gán chuyến đi (Ship Order)');
    }
  }

  Future<String> getShipmentByOrder(String orderId) async {
    try {
      final response = await _apiClient.dio.get('/outbound/orders/$orderId/shipment');
      if (response.data is Map && response.data['shipmentId'] != null) {
        return response.data['shipmentId'].toString();
      }
      throw Exception('Không tìm thấy Shipment ID cho đơn hàng này');
    } on DioException catch (e) {
      throw _handleError(e, 'Lỗi tra cứu Shipment của đơn hàng');
    }
  }

  Future<List<dynamic>> getPickTasksByOrder(String orderId) async {
    try {
      final response = await _apiClient.dio.get('/outbound/orders/$orderId/pick-tasks');
      return response.data as List<dynamic>;
    } on DioException catch (e) {
      throw _handleError(e, 'Lỗi lấy danh sách Pick Task của đơn hàng');
    }
  }

  Future<Map<String, dynamic>> getOutboundOrder(String orderId) async {
    try {
      final response = await _apiClient.dio.get('/outbound/orders/$orderId');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e, 'Lỗi lấy thông tin đơn hàng xuất kho');
    }
  }

  Future<void> assignWave(String waveId) async {
    final response = await _apiClient.dio.post('/outbound/waves/$waveId/assign');
    if (response.statusCode != 200) {
      throw Exception('Failed to assign wave');
    }
  }

  Future<void> startWave(String waveId) async {
    final response = await _apiClient.dio.post('/outbound/waves/$waveId/start');
    if (response.statusCode != 200) {
      throw Exception('Failed to start wave');
    }
  }

  Future<bool> sortOrder(String orderId) async {
    try {
      final response = await _apiClient.dio.put(
        '/outbound/sort',
        data: {'orderId': orderId},
      );
      return response.statusCode == 200;
    } on DioException catch (e) {
      throw _handleError(e, 'Lỗi hệ thống khi chia chọn (Sort)');
    }
  }

  Future<List<dynamic>> getWaves(String warehouseId) async {
    try {
      final response = await _apiClient.dio.get(
        '/outbound/waves',
        queryParameters: {'warehouseId': warehouseId},
      );
      return response.data as List<dynamic>;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        return [];
      }
      throw _handleError(e, 'Lỗi lấy danh sách Wave lấy hàng');
    }
  }

  Future<List<dynamic>> getOutboundOrders(String warehouseId) async {
    try {
      final response = await _apiClient.dio.get(
        '/outbound/orders',
        queryParameters: {'warehouseId': warehouseId},
      );
      return response.data as List<dynamic>;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        return [];
      }
      throw _handleError(e, 'Lỗi lấy danh sách đơn hàng xuất kho');
    }
  }

  Future<List<dynamic>> getShipments(String warehouseId) async {
    try {
      final response = await _apiClient.dio.get(
        '/outbound/shipments',
        queryParameters: {'warehouseId': warehouseId},
      );
      return response.data as List<dynamic>;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        return [];
      }
      throw _handleError(e, 'Lỗi lấy danh sách chuyến xe (Shipments)');
    }
  }
}
