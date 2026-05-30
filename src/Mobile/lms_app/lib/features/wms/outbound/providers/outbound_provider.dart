import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../data/outbound_repository.dart';

final outboundRepositoryProvider = Provider<OutboundRepository>((ref) {
  return OutboundRepository(apiClient);
});

// Cung cấp danh sách các Pick Tasks cho một WaveId cụ thể
final pickTasksProvider = FutureProvider.family<List<dynamic>, String>((ref, waveId) async {
  final repo = ref.watch(outboundRepositoryProvider);
  return repo.getPickTasksForWave(waveId);
});
