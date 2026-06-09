import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/app_config.dart';
import '../data/outbound_repository.dart';

final outboundRepositoryProvider = Provider<OutboundRepository>((ref) {
  return OutboundRepository(apiClient);
});

// Cung cấp danh sách các Pick Tasks cho một WaveId cụ thể
final pickTasksProvider = FutureProvider.family<List<dynamic>, String>((ref, waveId) async {
  final repo = ref.watch(outboundRepositoryProvider);
  return repo.getPickTasksForWave(waveId);
});

// Lấy danh sách Wave của kho hiện tại
final wavesProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final activeWarehouse = ref.watch(warehouseContextProvider);
  if (activeWarehouse == null || activeWarehouse.warehouseId.isEmpty) {
    return [];
  }
  final repo = ref.read(outboundRepositoryProvider);
  return await repo.getWaves(activeWarehouse.warehouseId);
});

// Lấy danh sách Shipment của kho hiện tại
final shipmentsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final activeWarehouse = ref.watch(warehouseContextProvider);
  if (activeWarehouse == null || activeWarehouse.warehouseId.isEmpty) {
    return [];
  }
  final repo = ref.read(outboundRepositoryProvider);
  return await repo.getShipments(activeWarehouse.warehouseId);
});

// Lấy danh sách Outbound Orders của kho hiện tại
final outboundOrdersProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final activeWarehouse = ref.watch(warehouseContextProvider);
  if (activeWarehouse == null || activeWarehouse.warehouseId.isEmpty) {
    return [];
  }
  final repo = ref.read(outboundRepositoryProvider);
  return await repo.getOutboundOrders(activeWarehouse.warehouseId);
});
