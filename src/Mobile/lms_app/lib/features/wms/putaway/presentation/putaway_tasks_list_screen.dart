import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_config.dart';
import '../../../auth/providers/auth_provider.dart';
import '../providers/putaway_providers.dart';

class PutawayTasksListScreen extends ConsumerWidget {
  const PutawayTasksListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasksAsync = ref.watch(putawayTasksProvider);
    final activeWarehouse = ref.watch(warehouseContextProvider);

    // Get current operator sub
    final authState = ref.watch(authProvider);
    String? operatorSub;
    if (authState is AuthAuthenticated) {
      operatorSub = authState.user.id;
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Hàng đợi Cất Hàng (Putaway Queue)'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(putawayTasksProvider),
          ),
        ],
      ),
      body: Column(
        children: [
          // Banner thông tin kho hiện tại
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            color: AppColors.primary.withOpacity(0.08),
            child: Row(
              children: [
                const Icon(Icons.warehouse, color: AppColors.primary, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Kho: ${activeWarehouse?.warehouseName ?? "Chưa chọn kho làm việc"}',
                    style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                ),
              ],
            ),
          ),
          
          Expanded(
            child: tasksAsync.when(
              data: (tasks) {
                // Chỉ hiển thị tasks chưa hoàn thành (Pending) và không gán cho người khác
                final pendingTasks = tasks.where((t) {
                  final status = t['status']?.toString().toLowerCase() == 'pending';
                  if (!status) return false;
                  final assignedTo = t['assignedTo']?.toString();
                  final isAssignedToOther = assignedTo != null && assignedTo.trim().isNotEmpty && assignedTo != operatorSub;
                  return !isAssignedToOther;
                }).toList();

                if (pendingTasks.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.assignment_turned_in, size: 64, color: AppColors.textSecondary),
                        SizedBox(height: 12),
                        Text(
                          'Không có tác vụ cất hàng nào đang chờ!',
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 16),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(putawayTasksProvider),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: pendingTasks.length,
                    itemBuilder: (context, index) {
                      final task = pendingTasks[index];
                      final taskId = task['id']?.toString() ?? '';
                      final sku = task['skuCode'] ?? task['sku'] ?? 'N/A';
                      final qty = task['quantity'] ?? 0;
                      final sourceBin = task['sourceBinCode'] ?? 'Pre-Dock';
                      final targetBin = task['targetBinCode'] ?? task['suggestedBinCode'] ?? 'N/A';
                      final receiptNo = task['receiptNo'] ?? 'N/A';
                      final assignedTo = task['assignedTo']?.toString();
                      final isAssignedToMe = assignedTo != null && assignedTo == operatorSub;

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 2,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () {
                            _showPutawayTaskDetails(context, ref, task, taskId, targetBin, operatorSub);
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: isAssignedToMe 
                                            ? AppColors.success.withOpacity(0.15) 
                                            : AppColors.warning.withOpacity(0.15),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(
                                        isAssignedToMe ? 'Nhiệm vụ của tôi' : 'Việc chưa nhận',
                                        style: TextStyle(
                                          color: isAssignedToMe ? AppColors.success : AppColors.warning,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                    Text(
                                      'Phiếu nhập: $receiptNo',
                                      style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  'SKU: $sku',
                                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('Nguồn (Source)', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                        const SizedBox(height: 2),
                                        Text(sourceBin, style: const TextStyle(fontWeight: FontWeight.w600)),
                                      ],
                                    ),
                                    const Icon(Icons.arrow_forward, color: AppColors.primary, size: 20),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('Kệ đích gợi ý', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                        const SizedBox(height: 2),
                                        Text(targetBin, style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
                                      ],
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        const Text('Số lượng', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                        const SizedBox(height: 2),
                                        Text('$qty PCS', style: const TextStyle(fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, stack) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, color: AppColors.error, size: 48),
                      const SizedBox(height: 12),
                      Text(
                        'Không thể tải dữ liệu: $err',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: AppColors.error),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => ref.invalidate(putawayTasksProvider),
                        child: const Text('Thử lại'),
                      )
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showPutawayTaskDetails(BuildContext context, WidgetRef ref, Map<String, dynamic> task, String taskId, String targetBin, String? operatorSub) {
    final assignedTo = task['assignedTo']?.toString();
    final bool isAssignedToMe = assignedTo != null && assignedTo == operatorSub;
    final bool isAssignedToOther = assignedTo != null && assignedTo.trim().isNotEmpty && assignedTo != operatorSub;

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
              const Text('Chi tiết Cất hàng (Putaway)', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const Divider(height: 24),
              _buildDetailRow('Mã Task', taskId),
              _buildDetailRow('Phiếu nhập', task['receiptNo'] ?? 'N/A'),
              _buildDetailRow('Sản phẩm (SKU)', task['skuCode'] ?? task['sku'] ?? 'N/A'),
              _buildDetailRow('Số lượng', '${task['quantity'] ?? 0} PCS'),
              _buildDetailRow('Nguồn (Source)', task['sourceBinCode'] ?? 'Pre-Dock'),
              _buildDetailRow('Kệ đích', targetBin),
              if (assignedTo != null && assignedTo.trim().isNotEmpty)
                _buildDetailRow('Người nhận', isAssignedToMe ? 'Bạn' : assignedTo),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Đóng'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  if (!isAssignedToOther)
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () async {
                          try {
                            if (!isAssignedToMe) {
                              await ref.read(putawayRepositoryProvider).assignPutawayTask(taskId);
                              ref.invalidate(putawayTasksProvider);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Nhận nhiệm vụ thành công')),
                                );
                              }
                            }
                            if (context.mounted) {
                              Navigator.pop(context);
                              context.push(
                                Uri(
                                  path: '/wms/putaway_execution',
                                  queryParameters: {
                                    'taskId': taskId,
                                    'targetBin': targetBin,
                                  },
                                ).toString(),
                              );
                            }
                          } catch (e) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Lỗi: ${e.toString()}')),
                              );
                            }
                          }
                        },
                        child: Text(isAssignedToMe ? 'Tiến hành' : 'Nhận việc'),
                      ),
                    ),
                ],
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
