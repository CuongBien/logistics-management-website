import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../../core/constants/app_colors.dart';
import '../../../auth/providers/auth_provider.dart';
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
    
    // E2E DEMO CHANGE: Strip OB:, ORD: or WAVE: prefixes if scanned/typed
    String cleanWaveId = waveId.trim();
    if (cleanWaveId.toUpperCase().startsWith('OB:')) {
      cleanWaveId = cleanWaveId.substring(3);
    } else if (cleanWaveId.toUpperCase().startsWith('ORD:')) {
      cleanWaveId = cleanWaveId.substring(4);
    } else if (cleanWaveId.toUpperCase().startsWith('WAVE:')) {
      cleanWaveId = cleanWaveId.substring(5);
    }

    setState(() {
      _isLoading = true;
      _activeWaveId = '';
    });

    try {
      final repo = ref.read(outboundRepositoryProvider);
      final tasks = await repo.getPickTasksForWave(cleanWaveId);
      
      setState(() {
        _tasks = tasks;
        _activeWaveId = cleanWaveId;
        _isLoading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('✅ Đã tải ${tasks.length} lệnh nhặt từ mã: $cleanWaveId'),
        backgroundColor: AppColors.success,
      ));
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('❌ Lỗi tải thông tin lấy hàng: ${e.toString().replaceAll('Exception: ', '')}'),
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
    // Get current operator sub
    final authState = ref.watch(authProvider);
    String? operatorSub;
    if (authState is AuthAuthenticated) {
      operatorSub = authState.user.id;
    }

    // Look up wave assignment in waves list
    final wavesAsync = ref.watch(wavesProvider);
    final wave = wavesAsync.value?.firstWhere(
      (w) => w['id']?.toString() == _activeWaveId || w['waveNo']?.toString() == _activeWaveId,
      orElse: () => null,
    );

    final ordersAsync = ref.watch(outboundOrdersProvider);
    final relatedOrder = ordersAsync.value?.firstWhere(
      (o) => o['id']?.toString() == _activeWaveId || o['orderNo']?.toString() == _activeWaveId,
      orElse: () => null,
    );

    // If it is an order picking task rather than a wave, check tasks to see if they are assigned to current operator
    final bool isOrderPick = relatedOrder != null;
    
    // Find assignment operator ID. Dotnet returns JSON fields in camelCase, so read 'assignedOperatorId'
    String? taskOperator;
    if (_tasks.isNotEmpty) {
      final firstTask = _tasks.first;
      taskOperator = (firstTask['assignedOperatorId'] ?? firstTask['AssignedOperatorId'])?.toString();
    }
    final bool anyTaskAssigned = taskOperator != null && taskOperator.trim().isNotEmpty;

    final assignedTo = wave != null 
        ? wave['assignedTo']?.toString() 
        : (isOrderPick ? taskOperator : null);

    debugPrint('Outbound picking: activeId=$_activeWaveId, operatorSub=$operatorSub, taskOperator=$taskOperator, anyTaskAssigned=$anyTaskAssigned, assignedTo=$assignedTo');

    final bool isAssignedToOther = assignedTo != null && assignedTo.trim().isNotEmpty && assignedTo != operatorSub;
    final bool isUnassigned = wave != null 
        ? (assignedTo == null || assignedTo.trim().isEmpty)
        : (isOrderPick && !anyTaskAssigned);

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
                                  if (isUnassigned)
                                    ElevatedButton.icon(
                                      onPressed: () async {
                                        setState(() => _isLoading = true);
                                        try {
                                          await ref.read(outboundRepositoryProvider).assignWave(_activeWaveId);
                                          ref.invalidate(wavesProvider);
                                          ref.invalidate(outboundOrdersProvider);
                                          // Reload list locally to fetch new assignedOperatorId values
                                          await _loadWave(_activeWaveId);
                                          if (context.mounted) {
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              const SnackBar(content: Text('Nhận nhiệm vụ thành công')),
                                            );
                                          }
                                        } catch (e) {
                                          if (context.mounted) {
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              SnackBar(content: Text('Lỗi nhận nhiệm vụ: ${e.toString().replaceAll('Exception: ', '')}')),
                                            );
                                          }
                                        } finally {
                                          setState(() => _isLoading = false);
                                        }
                                      },
                                      icon: const Icon(Icons.check),
                                      label: const Text('NHẬN VIỆC'),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppColors.warning,
                                        foregroundColor: Colors.white,
                                      ),
                                    )
                                  else if (isAssignedToOther)
                                    ElevatedButton.icon(
                                      onPressed: null,
                                      icon: const Icon(Icons.lock),
                                      label: const Text('ĐÃ ĐƯỢC GIAO'),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.grey.shade400,
                                        foregroundColor: Colors.white,
                                      ),
                                    )
                                  else
                                    ElevatedButton.icon(
                                      onPressed: () async {
                                        try {
                                          await ref.read(outboundRepositoryProvider).startWave(_activeWaveId);
                                        } catch (e) {
                                          debugPrint('Start wave error: $e');
                                        }
                                        if (context.mounted) {
                                          context.push('/wms/pick_execution/$_activeWaveId');
                                        }
                                      },
                                      icon: const Icon(Icons.play_arrow),
                                      label: const Text('BẮT ĐẦU'),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppColors.success,
                                        foregroundColor: Colors.white,
                                      ),
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

                                    return Container(
                                      margin: const EdgeInsets.only(bottom: 8),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(12),
                                        boxShadow: [
                                          BoxShadow(
                                            color: Colors.black.withValues(alpha: 0.03),
                                            blurRadius: 4,
                                            offset: const Offset(0, 2),
                                          )
                                        ],
                                        border: Border.all(color: Colors.grey.shade200),
                                      ),
                                      child: ListTile(
                                        onTap: () {
                                          _showTaskDetails(context, task);
                                        },
                                        leading: CircleAvatar(
                                          backgroundColor: status.toLowerCase() == 'completed' 
                                            ? AppColors.success.withValues(alpha: 0.2) 
                                            : AppColors.primary.withValues(alpha: 0.2),
                                          child: Icon(
                                            status.toLowerCase() == 'completed' ? Icons.check : Icons.assignment,
                                            color: status.toLowerCase() == 'completed' ? AppColors.success : AppColors.primary,
                                          ),
                                        ),
                                        title: Text('Kệ: $bin • SKU: $sku', style: const TextStyle(fontWeight: FontWeight.bold)),
                                        subtitle: Text('Số lượng: $qty PCS • Trạng thái: ${status.toLowerCase() == 'completed' ? 'Hoàn thành' : 'Đang chờ'}'),
                                        trailing: const Icon(Icons.chevron_right, color: Colors.grey),
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

  void _showTaskDetails(BuildContext context, Map<String, dynamic> task) {
    final status = task['status']?.toString() ?? 'Pending';
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Chi tiết Yêu cầu lấy hàng', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const Divider(height: 32),
              _buildDetailRow('Mã Task', task['taskId']?.toString() ?? 'N/A'),
              _buildDetailRow('Đơn hàng', task['orderNo'] ?? 'N/A'),
              _buildDetailRow('Sản phẩm (SKU)', task['sku'] ?? 'N/A'),
              _buildDetailRow('Số lượng', '${task['quantity'] ?? 0} PCS'),
              _buildDetailRow('Vị trí Kệ', task['binCode'] ?? 'N/A'),
              _buildDetailRow('Trạng thái', status.toLowerCase() == 'completed' ? 'Hoàn thành' : 'Đang chờ'),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Đóng'),
                ),
              )
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 120, child: Text(label, style: const TextStyle(color: AppColors.textSecondary))),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.bold))),
        ],
      ),
    );
  }
}
