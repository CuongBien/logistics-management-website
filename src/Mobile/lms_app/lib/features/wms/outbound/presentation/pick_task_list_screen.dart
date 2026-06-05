import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/constants/app_config.dart';
import '../providers/outbound_provider.dart';

class PickTaskListScreen extends ConsumerStatefulWidget {
  final String? waveId;
  const PickTaskListScreen({super.key, this.waveId});

  @override
  ConsumerState<PickTaskListScreen> createState() => _PickTaskListScreenState();
}

class _PickTaskListScreenState extends ConsumerState<PickTaskListScreen> {
  final TextEditingController _waveIdController = TextEditingController();
  List<dynamic> _tasks = [];
  bool _isLoading = false;
  String _activeWaveId = '';

  @override
  void initState() {
    super.initState();
    if (widget.waveId != null && widget.waveId!.isNotEmpty) {
      _waveIdController.text = widget.waveId!;
      Future.microtask(() => _loadWave(widget.waveId!));
    }
  }

  Future<void> _loadWave(String waveId) async {
    if (waveId.isEmpty) return;
    setState(() {
      _isLoading = true;
      _activeWaveId = '';
    });

    try {
      final repo = ref.read(outboundRepositoryProvider);
      final tasks = await repo.getPickTasksForWave(waveId);
      
      // Chặn nếu Wave thuộc kho khác kho đang làm việc
      if (tasks.isNotEmpty) {
        final activeWarehouse = ref.read(warehouseContextProvider);
        final taskWarehouseId = tasks[0]['warehouseId']?.toString() ?? tasks[0]['warehouse_id']?.toString() ?? '';
        
        if (activeWarehouse != null && activeWarehouse.warehouseId.isNotEmpty &&
            taskWarehouseId.isNotEmpty && taskWarehouseId != activeWarehouse.warehouseId) {
          throw Exception('Wave này thuộc kho khác (${tasks[0]['warehouseName'] ?? taskWarehouseId}).\nBạn đang ở kho: ${activeWarehouse.warehouseName}. Vui lòng chuyển đúng kho làm việc.');
        }
      }

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
