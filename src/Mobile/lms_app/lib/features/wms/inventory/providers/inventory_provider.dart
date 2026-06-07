import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/app_config.dart';
import '../data/inventory_repository.dart';

final inventoryRepositoryProvider = Provider<InventoryRepository>((ref) {
  return InventoryRepository(apiClient);
});

final warehouseHierarchyProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final activeWarehouse = ref.watch(warehouseContextProvider);
  if (activeWarehouse == null || activeWarehouse.warehouseId.isEmpty) {
    return {};
  }
  
  final repo = ref.read(inventoryRepositoryProvider);
  return await repo.getWarehouseHierarchy(activeWarehouse.warehouseId);
});

final replenishmentTasksProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final activeWarehouse = ref.watch(warehouseContextProvider);
  if (activeWarehouse == null || activeWarehouse.warehouseId.isEmpty) {
    return [];
  }
  
  final repo = ref.read(inventoryRepositoryProvider);
  return await repo.getReplenishmentTasks(activeWarehouse.warehouseId);
});

final cycleCountTasksProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final activeWarehouse = ref.watch(warehouseContextProvider);
  if (activeWarehouse == null || activeWarehouse.warehouseId.isEmpty) {
    return [];
  }
  
  final repo = ref.read(inventoryRepositoryProvider);
  return await repo.getCycleCountTasks(activeWarehouse.warehouseId);
});
