import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/app_config.dart';
import '../data/putaway_repository.dart';

final putawayRepositoryProvider = Provider<PutawayRepository>((ref) {
  return PutawayRepository(apiClient);
});

final putawayTasksProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final activeWarehouse = ref.watch(warehouseContextProvider);
  if (activeWarehouse == null || activeWarehouse.warehouseId.isEmpty) {
    return [];
  }
  
  final repo = ref.read(putawayRepositoryProvider);
  return await repo.getPutawayTasks(activeWarehouse.warehouseId);
});
