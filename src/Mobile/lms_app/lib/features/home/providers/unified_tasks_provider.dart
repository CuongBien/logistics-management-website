import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../wms/outbound/providers/outbound_provider.dart';
import '../../wms/putaway/providers/putaway_providers.dart';
import '../../wms/inventory/providers/inventory_provider.dart';

enum TaskType {
  picking,
  putaway,
  replenishment,
  count,
  other,
}

class InternalTask {
  final String id;
  final TaskType type;
  final String title;
  final String subtitle;
  final String status;
  final String primaryData;
  final String secondaryData;
  final String? assignedTo;
  final String? productName;
  final String? uom;
  final String? lotNo;
  final dynamic originalData;

  const InternalTask({
    required this.id,
    required this.type,
    required this.title,
    required this.subtitle,
    required this.status,
    required this.primaryData,
    required this.secondaryData,
    this.assignedTo,
    this.productName,
    this.uom,
    this.lotNo,
    required this.originalData,
  });

  Color get color {
    switch (type) {
      case TaskType.picking:
        return Colors.blue;
      case TaskType.putaway:
        return Colors.orange;
      case TaskType.replenishment:
        return Colors.teal;
      case TaskType.count:
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  IconData get icon {
    switch (type) {
      case TaskType.picking:
        return Icons.outbox;
      case TaskType.putaway:
        return Icons.move_to_inbox;
      case TaskType.replenishment:
        return Icons.low_priority;
      case TaskType.count:
        return Icons.fact_check;
      default:
        return Icons.assignment;
    }
  }

  String get typeName {
    switch (type) {
      case TaskType.picking:
        return 'Picking';
      case TaskType.putaway:
        return 'Putaway';
      case TaskType.replenishment:
        return 'Replenishment';
      case TaskType.count:
        return 'Count';
      default:
        return 'Task';
    }
  }
}

final unifiedTasksProvider = FutureProvider.autoDispose<List<InternalTask>>((ref) async {
  final wavesAsync = ref.watch(wavesProvider);
  final putawayAsync = ref.watch(putawayTasksProvider);
  final replenishmentAsync = ref.watch(replenishmentTasksProvider);
  final countAsync = ref.watch(cycleCountTasksProvider);
  
  final List<InternalTask> combinedTasks = [];

  // Add Picking Waves
  if (wavesAsync.hasValue && wavesAsync.value != null) {
    final repo = ref.read(outboundRepositoryProvider);
    for (final wave in wavesAsync.value!) {
      final status = wave['status']?.toString().toLowerCase() ?? '';
      if (status == 'picking' || status == 'created' || status == 'allocated' || status == 'new') {
        final waveId = wave['id']?.toString() ?? '';
        List<dynamic> pickTasks = [];
        try {
          pickTasks = await repo.getPickTasksForWave(waveId);
        } catch (e) {
          // Bỏ qua lỗi
        }

        final combinedData = <String, dynamic>{
          ...wave,
          'pickTasks': pickTasks,
        };

        combinedTasks.add(InternalTask(
          id: waveId,
          type: TaskType.picking,
          title: 'Đợt nhặt: ${wave['waveNo'] ?? 'N/A'}',
          subtitle: 'Quy mô: ${pickTasks.length} tác vụ',
          status: status,
          primaryData: '${wave['orderCount']} Đơn hàng',
          secondaryData: wave['type']?.toString() ?? 'Unknown',
          assignedTo: wave['assignedTo']?.toString(),
          originalData: {
            ...wave,
            'pickTasks': pickTasks,
          },
        ));
      }
    }
  }

  // Add Putaway Tasks
  if (putawayAsync.hasValue && putawayAsync.value != null) {
    for (final task in putawayAsync.value!) {
      final status = task['status']?.toString().toLowerCase() ?? '';
      // Only pending putaway
      if (status == 'pending') {
        final sku = task['skuCode'] ?? task['sku'] ?? 'N/A';
        final qty = task['quantity'] ?? 0;
        final targetBin = task['suggestedBinId'] ?? 'N/A';
        
        combinedTasks.add(InternalTask(
          id: task['id']?.toString() ?? '',
          type: TaskType.putaway,
          title: 'SKU: $sku',
          subtitle: 'Kệ đích: $targetBin',
          status: status,
          primaryData: 'Từ: ${task['sourceBinId']}',
          secondaryData: 'Đến: ${task['suggestedBinId']}',
          assignedTo: task['assignedTo']?.toString(),
          productName: task['productName']?.toString(),
          uom: task['uom']?.toString(),
          lotNo: task['lotNo']?.toString(),
          originalData: task,
        ));
      }
    }
  }

  // Add Replenishment Tasks
  if (replenishmentAsync.hasValue && replenishmentAsync.value != null) {
    for (final task in replenishmentAsync.value!) {
      final status = task['status']?.toString().toLowerCase() ?? '';
      if (status == 'pending' || status == 'inprogress') {
        final sku = task['sku'] ?? task['skuCode'] ?? 'N/A';
        final qty = task['quantity'] ?? task['quantityToReplenish'] ?? 0;
        final sourceBin = task['fromBinId'] ?? 'N/A';
        final targetBin = task['toBinId'] ?? 'N/A';
        
        combinedTasks.add(InternalTask(
          id: task['id']?.toString() ?? '',
          type: TaskType.replenishment,
          title: 'SKU: $sku',
          subtitle: 'Từ $sourceBin ➔ $targetBin',
          status: status,
          primaryData: '$qty PCS',
          secondaryData: 'Ưu tiên: ${task['priority'] ?? 'Bình thường'}',
          assignedTo: task['assignedTo']?.toString(),
          productName: task['productName']?.toString(),
          uom: task['uom']?.toString(),
          originalData: task,
        ));
      }
    }
  }

  // Add Count Tasks
  if (countAsync.hasValue && countAsync.value != null) {
    for (final task in countAsync.value!) {
      final status = task['status']?.toString().toLowerCase() ?? '';
      if (status == 'pending' || status == 'inprogress') {
        final binCode = task['binId'] ?? 'N/A';
        final sku = task['sku'] ?? 'Tất cả';
        final totalItems = task['expectedQty'] ?? 0;
        final countedItems = task['countedQty'] ?? 0;
        
        combinedTasks.add(InternalTask(
          id: task['id']?.toString() ?? '',
          type: TaskType.count,
          title: 'Kiểm kê kệ: $binCode',
          subtitle: 'SKU: $sku',
          status: status,
          primaryData: 'Đếm: $countedItems/$totalItems',
          secondaryData: 'Kệ $binCode',
          assignedTo: task['assignedTo']?.toString(),
          productName: task['productName']?.toString(),
          uom: task['uom']?.toString(),
          originalData: task,
        ));
      }
    }
  }

  // Sort tasks by ID or status if needed. We'll leave them mixed for now.
  return combinedTasks;
});
