import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';

class ReturnsRepository {
  final ApiClient _apiClient;

  ReturnsRepository(this._apiClient);

  Future<bool> processReturnDisposition({
    required String warehouseId,
    required String sku,
    required int quantity,
    required int condition, // 1 = Resellable (Good), 2 = Damaged (Scrap)
    required String? targetBinCode,
    required String referenceId,
    required String referenceType, // "Shipment" or "Order"
    String? notes,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/outbound/returns/disposition',
        data: {
          'WarehouseId': warehouseId,
          'Sku': sku,
          'Quantity': quantity,
          'Condition': condition,
          'TargetBinCode': targetBinCode,
          'ReferenceId': referenceId,
          'ReferenceType': referenceType,
          'Notes': notes ?? 'QC processed via Mobile PDA',
        },
      );
      return response.statusCode == 200;
    } on DioException catch (e) {
      throw Exception(e.response?.data['Message'] ?? 'Lỗi gửi phân loại hàng hoàn');
    }
  }
}
