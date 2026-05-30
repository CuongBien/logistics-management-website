import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';

class PutawayRepository {
  final ApiClient _apiClient;

  PutawayRepository(this._apiClient);

  Future<bool> completePutawayTask({
    required String taskId,
    required String scannedBinCode,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/inbound/putaway-tasks/$taskId/complete',
        data: {
          'ScannedDestinationBinCode': scannedBinCode,
        },
      );
      return response.statusCode == 200;
    } on DioException catch (e) {
      throw Exception(e.response?.data['Message'] ?? 'Lỗi xác nhận cất hàng (Putaway)');
    }
  }
}
