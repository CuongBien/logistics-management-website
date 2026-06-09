import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';

class DeliveryRepository {
  final ApiClient _apiClient;

  DeliveryRepository(this._apiClient);

  Future<bool> pickupOrder(String orderId, String driverId) async {
    try {
      final response = await _apiClient.dio.put(
        '/api/orders/$orderId/pickup', // Assuming API gateway routes /api/orders to Ordering.API
        data: {
          'DriverId': driverId,
        },
      );
      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      throw Exception('Lỗi gọi API Pickup: ${e.toString()}');
    }
  }
}

final deliveryRepositoryProvider = Provider<DeliveryRepository>((ref) {
  return DeliveryRepository(apiClient);
});
