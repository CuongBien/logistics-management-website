import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_config.dart';
import '../../../core/utils/role_manager.dart';
import '../../wms/outbound/providers/outbound_provider.dart';
import '../../wms/putaway/providers/putaway_provider.dart';
import '../../wms/inventory/providers/inventory_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/unified_tasks_provider.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  final AppRole role;
  
  const DashboardScreen({super.key, required this.role});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  TaskType? _selectedFilter;
  String _searchQuery = '';
  bool _showMyTasksOnly = false;
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final activeWarehouse = ref.watch(warehouseContextProvider);
    final unifiedTasksAsync = ref.watch(unifiedTasksProvider);

    return Column(
      children: [
        // Banner kho hiện tại
        _buildWarehouseBanner(activeWarehouse),
        
        // Thanh tìm kiếm
        _buildSearchBar(),

        // Thanh bộ lọc
        _buildFilterChips(),

        // Danh sách tác vụ hợp nhất
        Expanded(
          child: _buildUnifiedTaskList(unifiedTasksAsync),
        ),
      ],
    );
  }

  Widget _buildWarehouseBanner(WarehouseContext? activeWarehouse) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.primary.withBlue(180)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Row(
          children: [
            const CircleAvatar(
              backgroundColor: Colors.white24,
              child: Icon(Icons.warehouse, color: Colors.white),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'KHO LÀM VIỆC HIỆN TẠI',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.1,
                    ),
                  ),
                  Text(
                    activeWarehouse?.warehouseName ?? 'Chưa cấu hình kho làm việc',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: TextField(
        controller: _searchController,
        onChanged: (value) => setState(() => _searchQuery = value),
        decoration: InputDecoration(
          hintText: 'Tìm kiếm tác vụ (mã, mô tả)...',
          prefixIcon: const Icon(Icons.search, color: AppColors.textSecondary),
          suffixIcon: _searchQuery.isNotEmpty 
            ? IconButton(
                icon: const Icon(Icons.clear, size: 20),
                onPressed: () {
                  _searchController.clear();
                  setState(() => _searchQuery = '');
                },
              )
            : null,
          contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
          filled: true,
          fillColor: Colors.grey.shade100,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
        ),
      ),
    );
  }

  Widget _buildFilterChips() {
    return SizedBox(
      height: 50,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        children: [
          FilterChip(
            label: const Text('Của tôi'),
            selected: _showMyTasksOnly,
            onSelected: (selected) {
              setState(() => _showMyTasksOnly = selected);
            },
            selectedColor: AppColors.primary.withOpacity(0.2),
            labelStyle: TextStyle(
              color: _showMyTasksOnly ? AppColors.primary : AppColors.textSecondary,
              fontWeight: _showMyTasksOnly ? FontWeight.bold : FontWeight.normal,
            ),
            backgroundColor: Colors.grey.shade200,
            side: BorderSide.none,
          ),
          const SizedBox(width: 8),
          _buildChip(label: 'Tất cả', type: null),
          const SizedBox(width: 8),
          _buildChip(label: 'Picking', type: TaskType.picking),
          const SizedBox(width: 8),
          _buildChip(label: 'Putaway', type: TaskType.putaway),
          const SizedBox(width: 8),
          _buildChip(label: 'Replenish', type: TaskType.replenishment),
          const SizedBox(width: 8),
          _buildChip(label: 'Kiểm kê', type: TaskType.count),
        ],
      ),
    );
  }

  Widget _buildChip({required String label, required TaskType? type}) {
    final isSelected = _selectedFilter == type;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) {
          setState(() => _selectedFilter = type);
        }
      },
      selectedColor: AppColors.primary.withOpacity(0.2),
      labelStyle: TextStyle(
        color: isSelected ? AppColors.primary : AppColors.textSecondary,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
      backgroundColor: Colors.grey.shade200,
      side: BorderSide.none,
    );
  }

  Widget _buildUnifiedTaskList(AsyncValue<List<InternalTask>> tasksAsync) {
    return tasksAsync.when(
      data: (tasks) {
        // Lấy thông tin user hiện tại
        final authState = ref.watch(authProvider);
        String? operatorSub;
        if (authState is AuthAuthenticated) {
          operatorSub = authState.user.id;
        }

        // Áp dụng bộ lọc
        var filteredTasks = tasks.where((t) {
          // Ẩn hoàn toàn các task đã được giao cho người khác
          final isAssignedToOther = t.assignedTo != null && t.assignedTo!.trim().isNotEmpty && t.assignedTo != operatorSub;
          if (isAssignedToOther) return false;

          final matchFilter = _selectedFilter == null || t.type == _selectedFilter;
          final matchMyTasks = !_showMyTasksOnly || (t.assignedTo == operatorSub);
          final matchSearch = _searchQuery.isEmpty || 
              t.title.toLowerCase().contains(_searchQuery.toLowerCase()) || 
              t.subtitle.toLowerCase().contains(_searchQuery.toLowerCase());
          return matchFilter && matchMyTasks && matchSearch;
        }).toList();

        if (filteredTasks.isEmpty) {
          return _buildEmptyTaskView();
        }

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(unifiedTasksProvider),
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            itemCount: filteredTasks.length,
            itemBuilder: (context, index) {
              final task = filteredTasks[index];
              return _buildTaskCard(task);
            },
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, _) => _buildErrorTaskView(err, () => ref.invalidate(unifiedTasksProvider)),
    );
  }

  Widget _buildTaskCard(InternalTask task) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: task.color.withOpacity(0.3), width: 1),
      ),
      elevation: 1,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _handleTaskTap(task),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            gradient: LinearGradient(
              colors: [task.color.withOpacity(0.05), Colors.white],
              begin: Alignment.centerLeft,
              end: Alignment.center,
            ),
          ),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(task.icon, color: task.color, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        task.typeName.toUpperCase(),
                        style: TextStyle(
                          color: task.color,
                          fontWeight: FontWeight.w900,
                          fontSize: 10,
                          letterSpacing: 1.1,
                        ),
                      ),
                    ],
                  ),
                  _buildStatusBadge(task.status, task.color),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                task.title,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 4),
              Text(
                task.subtitle,
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
              ),
              const SizedBox(height: 12),
              const Divider(height: 1, color: Colors.black12),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Chi tiết', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                      const SizedBox(height: 2),
                      Text(task.primaryData, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                    ],
                  ),
                  if (task.secondaryData.isNotEmpty)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        const Text('Thông tin thêm', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                        const SizedBox(height: 2),
                        Text(task.secondaryData, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      ],
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _handleTaskTap(InternalTask task) {
    if (task.type == TaskType.picking) {
      _showPickingTaskDetails(context, task.originalData, task.id, task);
    } else if (task.type == TaskType.putaway) {
      final targetBin = task.originalData['targetBinCode'] ?? task.originalData['suggestedBinCode'] ?? 'N/A';
      _showPutawayTaskDetails(context, task.originalData, task.id, targetBin, task);
    } else if (task.type == TaskType.replenishment) {
      _showReplenishmentTaskDetails(context, task.originalData, task.id, task);
    } else if (task.type == TaskType.count) {
      _showCountTaskDetails(context, task.originalData, task.id, task);
    }
  }

  Widget _buildEmptyTaskView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle_outline, size: 60, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(
              'Tuyệt vời! Không tìm thấy tác vụ nào đang chờ xử lý.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade600, fontSize: 14, height: 1.4),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorTaskView(Object err, VoidCallback onRetry) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, color: AppColors.error, size: 40),
            const SizedBox(height: 12),
            Text(
              'Không thể kết nối tải tác vụ: $err',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.error, fontSize: 13),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: onRetry,
              child: const Text('Tải lại'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 10),
      ),
    );
  }

  void _showPutawayTaskDetails(BuildContext context, dynamic rawTask, String taskId, String targetBin, InternalTask internalTask) {
    final task = Map<String, dynamic>.from(rawTask as Map);
    final authState = ref.read(authProvider);
    final operatorSub = authState is AuthAuthenticated ? authState.user.id : null;
    final assignedTo = internalTask.assignedTo;
    
    final bool isAssignedToMe = assignedTo != null && assignedTo == operatorSub;
    final bool isAssignedToOther = assignedTo != null && assignedTo != operatorSub;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (sheetContext) {
        return SingleChildScrollView(
          child: Padding(
            padding: EdgeInsets.only(
              left: 24.0, right: 24.0, top: 24.0,
              bottom: MediaQuery.of(context).viewInsets.bottom + 24.0,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
              const Text('Chi tiết Cất hàng (Putaway)', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const Divider(height: 32),
              _buildDetailRow('Mã Task', taskId),
              if (internalTask.productName != null) _buildDetailRow('Sản phẩm', internalTask.productName!),
              _buildDetailRow('SKU', task['sku'] ?? 'N/A'),
              if (internalTask.lotNo != null) _buildDetailRow('Số Lô (Lot)', internalTask.lotNo!),
              _buildDetailRow('Số lượng', '${task['quantity'] ?? 0} ${internalTask.uom ?? 'PCS'}'),
              _buildDetailRow('Nguồn (Source)', task['sourceBinId'] ?? 'Pre-Dock'),
              _buildDetailRow('Kệ đích', targetBin),
              if (assignedTo != null) _buildDetailRow('Người nhận', isAssignedToMe ? 'Bạn' : assignedTo),
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
                          Navigator.pop(context);
                          if (!isAssignedToMe) {
                            try {
                              await ref.read(putawayRepositoryProvider).assignPutawayTask(taskId);
                              ref.invalidate(unifiedTasksProvider);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đã nhận việc thành công. Hãy bấm Tiến hành khi sẵn sàng.')));
                              }
                            } catch (e) {
                              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                            }
                          } else {
                            if (context.mounted) {
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
                          }
                        },
                        child: Text(isAssignedToMe ? 'Tiến hành' : 'Nhận việc'),
                      ),
                    ),
                ],
              )
            ],
          ),
        ),
      );
    },
  );
}

  void _showPickingTaskDetails(BuildContext context, dynamic rawTask, String taskId, InternalTask internalTask) {
    final task = Map<String, dynamic>.from(rawTask as Map);
    final authState = ref.read(authProvider);
    final operatorSub = authState is AuthAuthenticated ? authState.user.id : null;
    final assignedTo = internalTask.assignedTo;
    
    final bool isAssignedToMe = assignedTo != null && assignedTo == operatorSub;
    final bool isAssignedToOther = assignedTo != null && assignedTo != operatorSub;
    
    final pickTasks = task['pickTasks'] as List<dynamic>? ?? [];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (sheetContext) {
        return SingleChildScrollView(
          child: Padding(
            padding: EdgeInsets.only(
              left: 24.0, right: 24.0, top: 24.0,
              bottom: MediaQuery.of(context).viewInsets.bottom + 24.0,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
              const Text('Chi tiết Đợt lấy hàng (Picking Wave)', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const Divider(height: 32),
              _buildDetailRow('Đợt nhặt', task['waveNo'] ?? 'N/A'),
              _buildDetailRow('Loại Đợt', task['type'] ?? 'N/A'),
              _buildDetailRow('Tổng số đơn', '${task['orderCount'] ?? 0} Đơn'),
              if (assignedTo != null) _buildDetailRow('Người nhận', isAssignedToMe ? 'Bạn' : assignedTo),
              const SizedBox(height: 16),
              const Text('Danh sách cần lấy:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 8),
              if (pickTasks.isEmpty)
                const Text('Không có dữ liệu chi tiết.', style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic))
              else
                Container(
                  constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.35),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: ListView.separated(
                    shrinkWrap: true,
                    padding: const EdgeInsets.all(12),
                    itemCount: pickTasks.length,
                    separatorBuilder: (_, __) => const Divider(height: 16),
                    itemBuilder: (context, index) {
                      final pt = pickTasks[index];
                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                            child: const Icon(Icons.inventory_2, size: 16, color: AppColors.primary),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('${pt['productName'] ?? pt['sku'] ?? 'N/A'}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                                const SizedBox(height: 4),
                                Text('SKU: ${pt['sku'] ?? 'N/A'}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                const SizedBox(height: 2),
                                Text('Kệ: ${pt['binCode'] ?? 'N/A'}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                              ],
                            ),
                          ),
                          Text('${pt['quantity'] ?? 0} ${pt['uom'] ?? 'PCS'}', style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary, fontSize: 13)),
                        ],
                      );
                    },
                  ),
                ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(sheetContext),
                      child: const Text('Đóng'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  if (!isAssignedToOther)
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () async {
                          Navigator.pop(sheetContext);
                          if (!isAssignedToMe) {
                            try {
                              await ref.read(outboundRepositoryProvider).assignWave(taskId);
                              ref.invalidate(unifiedTasksProvider);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đã nhận việc thành công. Hãy bấm Tiến hành khi sẵn sàng.')));
                              }
                            } catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                              }
                            }
                          } else {
                            try {
                              await ref.read(outboundRepositoryProvider).startWave(taskId);
                              ref.invalidate(unifiedTasksProvider);
                            } catch (e) {
                              debugPrint('Start wave error: $e');
                            }
                            if (context.mounted) {
                              context.push('/wms/pick_execution/$taskId');
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
        ),
      );
    },
  );
}

  void _showReplenishmentTaskDetails(BuildContext context, dynamic rawTask, String taskId, InternalTask internalTask) {
    final task = Map<String, dynamic>.from(rawTask as Map);
    final authState = ref.read(authProvider);
    final operatorSub = authState is AuthAuthenticated ? authState.user.id : null;
    final assignedTo = internalTask.assignedTo;
    
    final bool isAssignedToMe = assignedTo != null && assignedTo == operatorSub;
    final bool isAssignedToOther = assignedTo != null && assignedTo != operatorSub;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (sheetContext) {
        return SingleChildScrollView(
          child: Padding(
            padding: EdgeInsets.only(
              left: 24.0, right: 24.0, top: 24.0,
              bottom: MediaQuery.of(context).viewInsets.bottom + 24.0,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
              const Text('Chi tiết Bổ sung (Replenishment)', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const Divider(height: 32),
              if (internalTask.productName != null) _buildDetailRow('Sản phẩm', internalTask.productName!),
              _buildDetailRow('SKU', task['sku'] ?? 'N/A'),
              _buildDetailRow('Số lượng', '${task['quantity'] ?? 0} ${internalTask.uom ?? 'PCS'}'),
              _buildDetailRow('Kệ nguồn', task['fromBinId'] ?? 'N/A'),
              _buildDetailRow('Kệ đích', task['toBinId'] ?? 'N/A'),
              _buildDetailRow('Mức ưu tiên', task['priority']?.toString() ?? 'Bình thường'),
              if (assignedTo != null) _buildDetailRow('Người nhận', isAssignedToMe ? 'Bạn' : assignedTo),
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
                          Navigator.pop(context);
                          if (!isAssignedToMe) {
                            try {
                              await ref.read(inventoryRepositoryProvider).assignReplenishmentTask(taskId);
                              ref.invalidate(unifiedTasksProvider);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đã nhận việc thành công. Hãy bấm Tiến hành khi sẵn sàng.')));
                              }
                            } catch (e) {
                              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                            }
                          } else {
                            if (context.mounted) {
                              try {
                                await ref.read(inventoryRepositoryProvider).startReplenishmentTask(taskId);
                                ref.invalidate(unifiedTasksProvider);
                              } catch (e) {
                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                                return;
                              }
                              if (context.mounted) {
                                context.push(
                                  Uri(
                                    path: '/wms/replenishment_execution',
                                    queryParameters: {
                                      'taskId': taskId,
                                      'sku': task['sku'] ?? '',
                                      'quantity': task['quantity']?.toString() ?? '0',
                                      'sourceBin': task['fromBinId'] ?? '',
                                      'destBin': task['toBinId'] ?? '',
                                    },
                                  ).toString(),
                                );
                              }
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
        ),
      );
    },
  );
}

  void _showCountTaskDetails(BuildContext context, dynamic rawTask, String taskId, InternalTask internalTask) {
    final task = Map<String, dynamic>.from(rawTask as Map);
    final authState = ref.read(authProvider);
    final operatorSub = authState is AuthAuthenticated ? authState.user.id : null;
    final assignedTo = internalTask.assignedTo;
    
    final bool isAssignedToMe = assignedTo != null && assignedTo == operatorSub;
    final bool isAssignedToOther = assignedTo != null && assignedTo != operatorSub;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (sheetContext) {
        return SingleChildScrollView(
          child: Padding(
            padding: EdgeInsets.only(
              left: 24.0, right: 24.0, top: 24.0,
              bottom: MediaQuery.of(context).viewInsets.bottom + 24.0,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
              const Text('Chi tiết Kiểm kê (Cycle Count)', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const Divider(height: 32),
              _buildDetailRow('Kệ kiểm kê', task['binId'] ?? 'N/A'),
              if (internalTask.productName != null) _buildDetailRow('Sản phẩm', internalTask.productName!),
              _buildDetailRow('SKU', task['sku'] ?? 'Tất cả'),
              _buildDetailRow('Tổng số', '${task['expectedQty'] ?? 0} ${internalTask.uom ?? ''}'),
              _buildDetailRow('Đã đếm', '${task['countedQty'] ?? 0}'),
              _buildDetailRow('Mức ưu tiên', task['priority']?.toString() ?? 'Bình thường'),
              if (assignedTo != null) _buildDetailRow('Người nhận', isAssignedToMe ? 'Bạn' : assignedTo),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(sheetContext),
                      child: const Text('Đóng'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  if (!isAssignedToOther)
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () async {
                          Navigator.pop(sheetContext);
                          if (!isAssignedToMe) {
                            try {
                              await ref.read(inventoryRepositoryProvider).assignCycleCountTask(taskId);
                              ref.invalidate(unifiedTasksProvider);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đã nhận việc thành công. Hãy bấm Tiến hành khi sẵn sàng.')));
                              }
                            } catch (e) {
                              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                            }
                          } else {
                            if (context.mounted) {
                              try {
                                await ref.read(inventoryRepositoryProvider).startCycleCountTask(taskId);
                                ref.invalidate(unifiedTasksProvider);
                              } catch (e) {
                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                                return;
                              }
                              if (context.mounted) {
                                context.push(
                                  Uri(
                                    path: '/wms/cycle_count_execution/$taskId',
                                    queryParameters: {
                                      'binCode': task['binId'] ?? '',
                                      'sku': task['sku'] ?? 'Tất cả',
                                    },
                                  ).toString(),
                                );
                              }
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
