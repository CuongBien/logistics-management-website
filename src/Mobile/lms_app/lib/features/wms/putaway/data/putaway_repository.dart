import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';

class PutawayRepository {
  final ApiClient _apiClient;

  PutawayRepository(this._apiClient);

  Future<void> assignPutawayTask(String taskId) async {
    final response = await _apiClient.dio.post('/inbound/putaway-tasks/$taskId/claim');
    if (response.statusCode != 200) {
      throw Exception('Failed to assign task');
    }
  }

  Future<List<dynamic>> getPutawayTasks(String warehouseId) async {
    try {
      final response = await _apiClient.dio.get(
        '/inbound/putaway-tasks',
        queryParameters: {'warehouseId': warehouseId},
      );
      return response.data as List<dynamic>;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        return [];
      }
      throw Exception(e.response?.data['Message'] ?? 'Lỗi kết nối API lấy danh sách Putaway Task');
    }
  }
}
