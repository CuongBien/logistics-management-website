import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_config.dart';
import '../../../core/utils/role_manager.dart';
import '../../wms/outbound/providers/outbound_provider.dart';
import '../../wms/putaway/providers/putaway_providers.dart';

class DashboardScreen extends ConsumerWidget {
  final AppRole role;
  
  const DashboardScreen({super.key, required this.role});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeWarehouse = ref.watch(warehouseContextProvider);
    
    // Đăng ký theo dõi các tác vụ động
    final wavesAsync = ref.watch(wavesProvider);
    final putawayAsync = ref.watch(putawayTasksProvider);

    // Xử lý giao diện cho quản lý (Manager)
    if (role == AppRole.manager) {
      return _buildManagerDashboard(context, activeWarehouse, wavesAsync, putawayAsync);
    }

    // Xử lý giao diện cho nhân viên (Operator) - My Tasks Dashboard
    return _buildOperatorDashboard(context, ref, activeWarehouse, wavesAsync, putawayAsync);
  }

  Widget _buildManagerDashboard(
    BuildContext context, 
    WarehouseContext? activeWarehouse,
    AsyncValue<List<dynamic>> wavesAsync,
    AsyncValue<List<dynamic>> putawayAsync,
  ) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Banner kho hiện tại
          _buildWarehouseBanner(activeWarehouse),
          const SizedBox(height: 16),
          
          const Text(
            'Tổng quan hiệu suất kho',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 12),
          
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            elevation: 3,
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        activeWarehouse?.warehouseName ?? 'Chưa chọn kho',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const Text(
                        '75% Sức chứa',
                        style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                      )
                    ],
                  ),
                  const SizedBox(height: 10),
                  const ClipRRect(
                    borderRadius: BorderRadius.all(Radius.circular(8)),
                    child: LinearProgressIndicator(
                      value: 0.75, 
                      minHeight: 12,
                      backgroundColor: Colors.black12,
                      valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Đã lưu trữ: 1,850 / 2,500 Pallets',
                    style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Số liệu thống kê tác vụ
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  title: 'Đợt Picking',
                  value: wavesAsync.when(
                    data: (list) => '${list.length}',
                    loading: () => '...',
                    error: (_, __) => '!',
                  ),
                  icon: Icons.outbox,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  title: 'Tác vụ cất hàng',
                  value: putawayAsync.when(
                    data: (list) => '${list.where((t) => t['status']?.toString().toLowerCase() == 'pending').length}',
                    loading: () => '...',
                    error: (_, __) => '!',
                  ),
                  icon: Icons.move_to_inbox,
                  color: Colors.amber,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          
          const Text(
            'Tình trạng hoạt động (Backlog)',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: Colors.red.withOpacity(0.15),
                child: const Icon(Icons.warning, color: Colors.red),
              ),
              title: const Text('120 Đơn hàng xuất kho đang đợi phân bổ'),
              subtitle: const Text('Yêu cầu xử lý nhanh để kịp giờ xuất bến'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOperatorDashboard(
    BuildContext context,
    WidgetRef ref,
    WarehouseContext? activeWarehouse,
    AsyncValue<List<dynamic>> wavesAsync,
    AsyncValue<List<dynamic>> putawayAsync,
  ) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        body: Column(
          children: [
            // Banner kho hiện tại
            _buildWarehouseBanner(activeWarehouse),
            
            // TabBar điều khiển công việc
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: Container(
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: TabBar(
                  indicator: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  labelColor: Colors.white,
                  unselectedLabelColor: AppColors.textSecondary,
                  labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  tabs: const [
                    Tab(text: 'Lấy hàng (Picking)'),
                    Tab(text: 'Cất hàng (Putaway)'),
                  ],
                ),
              ),
            ),

            // Danh sách các tác vụ theo Tab
            Expanded(
              child: TabBarView(
                children: [
                  // Tab 1: Picking Waves
                  _buildPickingTab(context, ref, wavesAsync),
                  
                  // Tab 2: Putaway Tasks
                  _buildPutawayTab(context, ref, putawayAsync),
                ],
              ),
            ),

            // Panel Tiện ích nhanh dưới cùng
            _buildQuickUtilities(context),
          ],
        ),
      ),
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

  Widget _buildPickingTab(BuildContext context, WidgetRef ref, AsyncValue<List<dynamic>> wavesAsync) {
    return wavesAsync.when(
      data: (waves) {
        // Lọc các wave gom hàng nhặt đang active
        final activeWaves = waves.where((w) {
          final status = w['status']?.toString().toLowerCase() ?? '';
          return status == 'picking' || status == 'created' || status == 'allocated';
        }).toList();

        if (activeWaves.isEmpty) {
          return _buildEmptyTaskView(
            icon: Icons.check_circle_outline,
            message: 'Tuyệt vời! Không có đợt gom hàng lấy hàng nào đang chờ xử lý.',
          );
        }

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(wavesProvider),
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            itemCount: activeWaves.length,
            itemBuilder: (context, index) {
              final wave = activeWaves[index];
              final waveId = wave['id']?.toString() ?? '';
              final waveNo = wave['waveNo']?.toString() ?? 'N/A';
              final orderCount = wave['orderCount'] ?? 0;
              final status = wave['status']?.toString() ?? 'Pending';
              final type = wave['type']?.toString() ?? 'N/A';
              
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 2,
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () => context.push('/wms/pick_tasks/$waveId'),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Đợt nhặt: $waveNo',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary),
                            ),
                            _buildStatusBadge(status),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Phân loại', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                                const SizedBox(height: 2),
                                Text(type, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                const Text('Quy mô', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                                const SizedBox(height: 2),
                                Text('$orderCount Đơn hàng', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
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
      error: (err, _) => _buildErrorTaskView(err, () => ref.invalidate(wavesProvider)),
    );
  }

  Widget _buildPutawayTab(BuildContext context, WidgetRef ref, AsyncValue<List<dynamic>> putawayAsync) {
    return putawayAsync.when(
      data: (tasks) {
        // Chỉ lấy các task putaway Pending
        final pendingTasks = tasks.where((t) => t['status']?.toString().toLowerCase() == 'pending').toList();

        if (pendingTasks.isEmpty) {
          return _buildEmptyTaskView(
            icon: Icons.assignment_turned_in_outlined,
            message: 'Tất cả các sản phẩm đã được cất kệ! Không có hàng tồn đọng.',
          );
        }

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(putawayTasksProvider),
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            itemCount: pendingTasks.length,
            itemBuilder: (context, index) {
              final task = pendingTasks[index];
              final taskId = task['id']?.toString() ?? '';
              final sku = task['skuCode'] ?? task['sku'] ?? 'N/A';
              final qty = task['quantity'] ?? 0;
              final sourceBin = task['sourceBinCode'] ?? 'Pre-Dock';
              final targetBin = task['targetBinCode'] ?? task['suggestedBinCode'] ?? 'N/A';
              
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 2,
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () {
                    context.push(
                      Uri(
                        path: '/wms/putaway_execution',
                        queryParameters: {
                          'taskId': taskId,
                          'targetBin': targetBin,
                        },
                      ).toString(),
                    );
                  },
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'SKU: $sku',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.orange.shade50,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                'SL: $qty PCS',
                                style: TextStyle(color: Colors.orange.shade800, fontWeight: FontWeight.bold, fontSize: 11),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Từ nguồn', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                                const SizedBox(height: 2),
                                Text(sourceBin, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                              ],
                            ),
                            const Icon(Icons.arrow_forward_sharp, color: AppColors.primary, size: 16),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                const Text('Gợi ý cất', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                                const SizedBox(height: 2),
                                Text(targetBin, style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 13)),
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
      error: (err, _) => _buildErrorTaskView(err, () => ref.invalidate(putawayTasksProvider)),
    );
  }

  Widget _buildEmptyTaskView({required IconData icon, required String message}) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 60, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(
              message,
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

  Widget _buildStatusBadge(String status) {
    Color color = Colors.grey;
    if (status.toLowerCase() == 'picking' || status.toLowerCase() == 'in_progress') {
      color = AppColors.primary;
    } else if (status.toLowerCase() == 'allocated' || status.toLowerCase() == 'created') {
      color = Colors.blueGrey;
    }
    
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

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: color.withOpacity(0.12),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    value,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickUtilities(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, -2),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'TIỆN ÍCH NGHIỆP VỤ NHANH',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              color: AppColors.textSecondary,
              letterSpacing: 1.1,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildUtilityButton(
                context: context,
                icon: Icons.download,
                label: 'Nhập kho',
                onTap: () => context.push('/wms/receive'),
                color: Colors.green,
              ),
              _buildUtilityButton(
                context: context,
                icon: Icons.compare_arrows,
                label: 'Luân chuyển',
                onTap: () => context.push('/wms/transit-receive'),
                color: Colors.purple,
              ),
              _buildUtilityButton(
                context: context,
                icon: Icons.fact_check,
                label: 'Kiểm kê',
                onTap: () => context.push('/wms/count'),
                color: Colors.orange,
              ),
              _buildUtilityButton(
                context: context,
                icon: Icons.search,
                label: 'Tra cứu',
                onTap: () => context.push('/wms/inventory'),
                color: Colors.blueGrey,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildUtilityButton({
    required BuildContext context,
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    required Color color,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
        child: Column(
          children: [
            CircleAvatar(
              backgroundColor: color.withOpacity(0.08),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
          ],
        ),
      ),
    );
  }
}
