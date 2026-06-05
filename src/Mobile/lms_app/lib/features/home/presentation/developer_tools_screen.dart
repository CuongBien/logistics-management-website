import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_config.dart';
import '../../wms/outbound/providers/outbound_provider.dart';

String _generateRandomGuid() {
  final random = Random();
  String hex(int max, int length) {
    final val = random.nextInt(max);
    return val.toRadixString(16).padLeft(length, '0');
  }
  return '${hex(0xFFFFFFFF, 8)}-${hex(0xFFFF, 4)}-${hex(0xFFFF, 4)}-${hex(0xFFFF, 4)}-${hex(0xFFFFFFFFFFFF, 12)}';
}

class DeveloperToolsScreen extends ConsumerStatefulWidget {
  const DeveloperToolsScreen({super.key});

  @override
  ConsumerState<DeveloperToolsScreen> createState() => _DeveloperToolsScreenState();
}

class _DeveloperToolsScreenState extends ConsumerState<DeveloperToolsScreen> {
  bool _isLoading = false;

  Future<void> _runSingleOrderE2E() async {
    setState(() => _isLoading = true);
    final repo = ref.read(outboundRepositoryProvider);
    final orderId = _generateRandomGuid();
    final randomInt = Random().nextInt(100000);
    final orderNo = 'ORD-E2E-$randomInt';
    final activeWarehouse = ref.read(warehouseContextProvider);

    try {
      // Step 1: Create Outbound Order
      await repo.createTestOrder(
        orderId: orderId,
        orderNo: orderNo,
        sku: 'SKU-RED-TSHIRT',
        quantity: 1,
        warehouseId: activeWarehouse?.warehouseId,
      );

      // Step 2: Allocate Stock
      await repo.allocateStock(orderId);

      // Step 3: Pick Order
      await repo.pickStock(orderId);

      // Tải pick tasks của đơn để lấy Wave ID
      final orderTasks = await repo.getPickTasksByOrder(orderId);
      if (orderTasks.isEmpty) {
        throw Exception('Không sinh được Pick Task. Hãy kiểm tra tồn kho.');
      }
      final waveId = orderTasks[0]['waveId']?.toString() ?? 'WAVE-001';

      setState(() => _isLoading = false);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('🎉 Tạo & Phân bổ thành công đơn $orderNo! Wave ID: $waveId'),
          backgroundColor: AppColors.success,
        ));
        context.push('/wms/pick_tasks/$waveId');
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('❌ Lỗi luồng E2E: ${e.toString().replaceAll('Exception: ', '')}'),
          backgroundColor: AppColors.error,
        ));
      }
    }
  }

  Future<void> _runWaveE2E() async {
    setState(() => _isLoading = true);
    final repo = ref.read(outboundRepositoryProvider);
    final random = Random();
    final activeWarehouse = ref.read(warehouseContextProvider);

    try {
      // Tạo Order 1 (RED TSHIRT)
      final oId1 = _generateRandomGuid();
      final oNo1 = 'ORD-MUL-${random.nextInt(100000)}';
      await repo.createTestOrder(
        orderId: oId1,
        orderNo: oNo1,
        sku: 'SKU-RED-TSHIRT',
        quantity: 1,
        warehouseId: activeWarehouse?.warehouseId,
      );
      await repo.allocateStock(oId1);

      // Tạo Order 2 (BLUE JEANS)
      final oId2 = _generateRandomGuid();
      final oNo2 = 'ORD-MUL-${random.nextInt(100000)}';
      await repo.createTestOrder(
        orderId: oId2,
        orderNo: oNo2,
        sku: 'SKU-BLUE-JEANS',
        quantity: 1,
        warehouseId: activeWarehouse?.warehouseId,
      );
      await repo.allocateStock(oId2);

      // Step 3: Auto Plan Waves (Gom Wave)
      final result = await repo.autoPlanWaves(warehouseId: activeWarehouse?.warehouseId);
      final createdWaves = result['createdWaveIds'] as List<dynamic>? ?? [];

      if (createdWaves.isEmpty) {
        throw Exception('Không có đơn hàng nào được gom nhóm thành Wave.');
      }
      final waveId = createdWaves[0].toString();

      setState(() => _isLoading = false);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('🎉 Đã lập Wave thành công! Wave ID: $waveId'),
          backgroundColor: AppColors.success,
        ));
        context.push('/wms/pick_tasks/$waveId');
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('❌ Lỗi luồng E2E Wave: ${e.toString().replaceAll('Exception: ', '')}'),
          backgroundColor: AppColors.error,
        ));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final activeWarehouse = ref.watch(warehouseContextProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Developer & Testing Tools'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              color: AppColors.primary.withOpacity(0.06),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: AppColors.primary.withOpacity(0.2)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.auto_awesome, color: AppColors.primary),
                        SizedBox(width: 8),
                        Text(
                          'Trợ lý Kiểm thử E2E Outbound',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Tạo dữ liệu test nhanh trong kho đang chọn: ${activeWarehouse?.warehouseName ?? "N/A"}.',
                      style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 16),
                    if (_isLoading)
                      const Center(child: CircularProgressIndicator())
                    else ...[
                      ElevatedButton.icon(
                        onPressed: _runSingleOrderE2E,
                        icon: const Icon(Icons.bolt),
                        label: const Text('Tạo & Gom Đơn Lẻ E2E'),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        onPressed: _runWaveE2E,
                        icon: const Icon(Icons.grid_view),
                        label: const Text('Tạo 2 Đơn & Gom Wave E2E'),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          backgroundColor: AppColors.warning,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: Text(
                  '💡 Lưu ý: Các tính năng này gửi yêu cầu trực tiếp đến API Backend để tự động tạo Order, phân bổ và lập kế hoạch Picking nhằm phục vụ E2E test nhanh trên mobile.',
                  style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
