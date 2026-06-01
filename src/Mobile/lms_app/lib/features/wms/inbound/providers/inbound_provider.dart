import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../data/inbound_repository.dart';

// Cung cấp instance của InboundRepository
final inboundRepositoryProvider = Provider<InboundRepository>((ref) {
  return InboundRepository(apiClient);
});

// AsyncNotifier xử lý trạng thái API (Riverpod 2.0/3.0)
class ReceiveItemNotifier extends AsyncNotifier<Map<String, dynamic>?> {
  @override
  FutureOr<Map<String, dynamic>?> build() {
    return null; // Trạng thái ban đầu
  }

  Future<void> receiveItem({
    required String receiptId,
    required String orderId,
    required String skuCode,
    required String binCode,
    required int quantity,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final repo = ref.read(inboundRepositoryProvider);
      return await repo.receiveItem(
        receiptId: receiptId,
        orderId: orderId,
        skuCode: skuCode,
        binCode: binCode,
        quantity: quantity,
      );
    });
  }
}

final receiveItemProvider = AsyncNotifierProvider<ReceiveItemNotifier, Map<String, dynamic>?>(() {
  return ReceiveItemNotifier();
});
