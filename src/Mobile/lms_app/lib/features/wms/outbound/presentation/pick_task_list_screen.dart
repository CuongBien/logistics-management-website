import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../../core/constants/app_colors.dart';
import '../providers/outbound_provider.dart';

String _generateRandomGuid() {
  final random = Random();
  String hex(int max, int length) {
    final val = random.nextInt(max);
    return val.toRadixString(16).padLeft(length, '0');
  }
  return '${hex(0xFFFFFFFF, 8)}-${hex(0xFFFF, 4)}-${hex(0xFFFF, 4)}-${hex(0xFFFF, 4)}-${hex(0xFFFFFFFFFFFF, 12)}';
}

class PickTaskListScreen extends ConsumerStatefulWidget {
  const PickTaskListScreen({super.key});

  @override
  ConsumerState<PickTaskListScreen> createState() => _PickTaskListScreenState();
}

class _PickTaskListScreenState extends ConsumerState<PickTaskListScreen> {
  final TextEditingController _waveIdController = TextEditingController();
  List<dynamic> _tasks = [];
  bool _isLoading = false;
  String _activeWaveId = '';

  Future<void> _loadWave(String waveId) async {
    if (waveId.isEmpty) return;
    setState(() {
      _isLoading = true;
      _activeWaveId = '';
    });

    try {
      final repo = ref.read(outboundRepositoryProvider);
      final tasks = await repo.getPickTasksForWave(waveId);
      
      setState(() {
        _tasks = tasks;
        _activeWaveId = waveId;
        _isLoading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('✅ Đã tải ${tasks.length} lệnh nhặt từ Wave: $waveId'),
        backgroundColor: AppColors.success,
      ));
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('❌ Lỗi tải Wave: ${e.toString().replaceAll('Exception: ', '')}'),
        backgroundColor: AppColors.error,
      ));
    }
  }

  Future<void> _runSingleOrderE2E() async {
    setState(() => _isLoading = true);
    final repo = ref.read(outboundRepositoryProvider);
    final orderId = _generateRandomGuid();
    final randomInt = Random().nextInt(100000);
    final orderNo = 'ORD-E2E-$randomInt';

    try {
      // Step 1: Create Outbound Order
      await repo.createTestOrder(
        orderId: orderId,
        orderNo: orderNo,
        sku: 'SKU-RED-TSHIRT',
        quantity: 1,
      );

      // Step 2: Allocate Stock
      await repo.allocateStock(orderId);

      // Step 3: Pick Order (creates wave WAVE-...)
      await repo.pickStock(orderId);

      // Tải pick tasks của đơn hàng để lấy Wave ID
      final orderTasks = await _apiClientGetPickTasks(orderId);
      if (orderTasks.isEmpty) {
        throw Exception('Không sinh được Pick Task. Hãy kiểm tra tồn kho kho HCM.');
      }
      final waveId = orderTasks[0]['waveId']?.toString() ?? 'WAVE-001';

      setState(() {
        _isLoading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('🎉 Tạo & Phân bổ thành công đơn $orderNo! Wave ID: $waveId'),
        backgroundColor: AppColors.success,
      ));

      // Đi thẳng tới màn hình Lấy hàng
      if (mounted) {
        context.push('/wms/pick_execution/$waveId');
      }
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('❌ Lỗi luồng E2E: ${e.toString().replaceAll('Exception: ', '')}'),
        backgroundColor: AppColors.error,
      ));
    }
  }

  Future<void> _runWaveE2E() async {
    setState(() => _isLoading = true);
    final repo = ref.read(outboundRepositoryProvider);
    final random = Random();

    try {
      // Tạo Order 1 (RED TSHIRT)
      final oId1 = _generateRandomGuid();
      final oNo1 = 'ORD-MUL-${random.nextInt(100000)}';
      await repo.createTestOrder(orderId: oId1, orderNo: oNo1, sku: 'SKU-RED-TSHIRT', quantity: 1);
      await repo.allocateStock(oId1);

      // Tạo Order 2 (BLUE JEANS)
      final oId2 = _generateRandomGuid();
      final oNo2 = 'ORD-MUL-${random.nextInt(100000)}';
      await repo.createTestOrder(orderId: oId2, orderNo: oNo2, sku: 'SKU-BLUE-JEANS', quantity: 1);
      await repo.allocateStock(oId2);

      // Step 3: Auto Plan Waves (Gom Wave)
      final result = await repo.autoPlanWaves();
      final createdWaves = result['createdWaveIds'] as List<dynamic>? ?? [];

      if (createdWaves.isEmpty) {
        throw Exception('Không có đơn hàng nào được gom nhóm thành Wave.');
      }
      final waveId = createdWaves[0].toString();

      setState(() {
        _isLoading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('🎉 Đã lập Wave thành công! Wave ID: $waveId'),
        backgroundColor: AppColors.success,
      ));

      // Đi thẳng tới màn hình Lấy hàng
      if (mounted) {
        context.push('/wms/pick_execution/$waveId');
      }
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('❌ Lỗi luồng E2E Wave: ${e.toString().replaceAll('Exception: ', '')}'),
        backgroundColor: AppColors.error,
      ));
    }
  }

  Future<List<dynamic>> _apiClientGetPickTasks(String orderId) async {
    try {
      final repo = ref.read(outboundRepositoryProvider);
      return await repo.getPickTasksByOrder(orderId);
    } catch (_) {
      return [];
    }
  }

  @override
  void dispose() {
    _waveIdController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Danh sách Lấy Hàng (Outbound)'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // E2E Assistant Card
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
                    const Row(
                      children: [
                        Icon(Icons.auto_awesome, color: AppColors.primary),
                        SizedBox(width: 8),
                        Text(
                          'Trợ lý Kiểm thử Outbound E2E (HCM Hub)',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.primary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _isLoading ? null : _runSingleOrderE2E,
                            icon: const Icon(Icons.flash_on, size: 18),
                            label: const Text('Đơn lẻ E2E'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _isLoading ? null : _runWaveE2E,
                            icon: const Icon(Icons.grid_view, size: 18),
                            label: const Text('Gom Wave E2E'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.warning,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Nhập Wave ID
            Card(
              elevation: 3,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _waveIdController,
                        decoration: const InputDecoration(
                          labelText: 'Quét hoặc nhập Wave ID',
                          prefixIcon: Icon(Icons.barcode_reader),
                          border: OutlineInputBorder(),
                        ),
                        onSubmitted: (value) {
                          if (value.isNotEmpty) _loadWave(value.trim());
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: () {
                        _loadWave(_waveIdController.text.trim());
                      },
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                      ),
                      child: const Icon(Icons.search),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Danh sách Pick Task
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _tasks.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: const [
                              Icon(Icons.outbox, size: 64, color: AppColors.textSecondary),
                              SizedBox(height: 8),
                              Text(
                                'Chưa tải danh sách lấy hàng.\nVui lòng quét Wave ID hoặc dùng Trợ lý E2E.',
                                textAlign: TextAlign.center,
                                style: TextStyle(color: AppColors.textSecondary),
                              )
                            ],
                          ),
                        )
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Danh sách nhặt (Wave: $_activeWaveId):',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                  ),
                                  ElevatedButton(
                                    onPressed: () {
                                      context.push('/wms/pick_execution/$_activeWaveId');
                                    },
                                    child: const Text('BẮT ĐẦU NHẶT'),
                                  )
                                ],
                              ),
                            ),
                            Expanded(
                              child: ListView.builder(
                                itemCount: _tasks.length,
                                itemBuilder: (context, index) {
                                    final task = _tasks[index];
                                    final bin = task['binCode'] ?? 'N/A';
                                    final sku = task['sku'] ?? 'N/A';
                                    final qty = task['quantity'] ?? 0;
                                    final status = task['status']?.toString() ?? 'Pending';

                                    return Card(
                                      child: ListTile(
                                        leading: CircleAvatar(
                                          backgroundColor: status.toLowerCase() == 'completed' 
                                            ? AppColors.success.withOpacity(0.2) 
                                            : AppColors.primary.withOpacity(0.2),
                                          child: Icon(
                                            status.toLowerCase() == 'completed' ? Icons.check : Icons.assignment,
                                            color: status.toLowerCase() == 'completed' ? AppColors.success : AppColors.primary,
                                          ),
                                        ),
                                        title: Text('Kệ: $bin • SKU: $sku', style: const TextStyle(fontWeight: FontWeight.bold)),
                                        subtitle: Text('Số lượng: $qty PCS • Trạng thái: $status'),
                                      ),
                                    );
                                },
                              ),
                            ),
                          ],
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
