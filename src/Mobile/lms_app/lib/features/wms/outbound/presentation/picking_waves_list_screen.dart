import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_config.dart';
import '../../../auth/providers/auth_provider.dart';
import '../providers/outbound_provider.dart';

class PickingWavesListScreen extends ConsumerStatefulWidget {
  const PickingWavesListScreen({super.key});

  @override
  ConsumerState<PickingWavesListScreen> createState() => _PickingWavesListScreenState();
}

class _PickingWavesListScreenState extends ConsumerState<PickingWavesListScreen> {
  DateTime? _selectedDate;

  @override
  Widget build(BuildContext context) {
    final wavesAsync = ref.watch(wavesProvider);
    final activeWarehouse = ref.watch(warehouseContextProvider);

    // Get current operator sub
    final authState = ref.watch(authProvider);
    String? operatorSub;
    if (authState is AuthAuthenticated) {
      operatorSub = authState.user.id;
    }

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Đợt Nhặt Hàng (Waves)'),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () => ref.invalidate(wavesProvider),
            ),
          ],
          bottom: const TabBar(
            indicatorColor: AppColors.primary,
            labelColor: AppColors.primary,
            unselectedLabelColor: Colors.grey,
            tabs: [
              Tab(
                icon: Icon(Icons.run_circle_outlined),
                text: 'Đang hoạt động',
              ),
              Tab(
                icon: Icon(Icons.check_circle_outline),
                text: 'Đã hoàn thành',
              ),
            ],
          ),
        ),
        body: Column(
          children: [
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
              child: wavesAsync.when(
                data: (waves) {
                  // Lọc waves đang active (Picking, New, etc.)
                  final activeWaves = waves.where((w) {
                    final status = w['status']?.toString().toLowerCase() ?? '';
                    final isPickingOrNew = status == 'picking' || status == 'created' || status == 'allocated' || status == 'new';
                    if (!isPickingOrNew) return false;
                    
                    final assignedTo = w['assignedTo']?.toString();
                    final isAssignedToOther = assignedTo != null && assignedTo.trim().isNotEmpty && assignedTo != operatorSub;
                    return !isAssignedToOther;
                  }).toList();

                  // Lọc waves đã hoàn thành hoặc đã hủy
                  final completedWaves = waves.where((w) {
                    final status = w['status']?.toString().toLowerCase() ?? '';
                    final isCompleted = status == 'completed' || status == 'cancelled';
                    if (!isCompleted) return false;
                    
                    if (_selectedDate != null && w['createdAt'] != null) {
                      final createdAt = DateTime.parse(w['createdAt']).toLocal();
                      return createdAt.year == _selectedDate!.year &&
                          createdAt.month == _selectedDate!.month &&
                          createdAt.day == _selectedDate!.day;
                    }
                    return true;
                  }).toList();

                  return TabBarView(
                    children: [
                      _buildActiveTab(activeWaves, operatorSub),
                      _buildCompletedTab(completedWaves),
                    ],
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
                          onPressed: () => ref.invalidate(wavesProvider),
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
      ),
    );
  }

  Widget _buildActiveTab(List<dynamic> activeWaves, String? operatorSub) {
    if (activeWaves.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.checklist, size: 64, color: AppColors.textSecondary),
            SizedBox(height: 12),
            Text(
              'Không có đợt gom hàng nhặt nào đang hoạt động!',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 16),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(wavesProvider),
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: activeWaves.length,
        itemBuilder: (context, index) {
          final wave = activeWaves[index];
          return _buildWaveCard(wave, operatorSub, isActive: true);
        },
      ),
    );
  }

  Widget _buildCompletedTab(List<dynamic> completedWaves) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 5,
                offset: const Offset(0, 2),
              )
            ],
            border: Border(bottom: BorderSide(color: Colors.grey.shade100)),
          ),
          child: Row(
            children: [
              const Icon(Icons.filter_list, color: AppColors.primary, size: 20),
              const SizedBox(width: 8),
              const Text(
                'Lọc theo ngày:',
                style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary, fontSize: 13),
              ),
              const Spacer(),
              InkWell(
                onTap: () async {
                  final DateTime? picked = await showDatePicker(
                    context: context,
                    initialDate: _selectedDate ?? DateTime.now(),
                    firstDate: DateTime(2020),
                    lastDate: DateTime.now(),
                  );
                  if (picked != null) {
                    setState(() {
                      _selectedDate = picked;
                    });
                  }
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _selectedDate != null ? AppColors.primary.withOpacity(0.1) : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: _selectedDate != null ? AppColors.primary.withOpacity(0.3) : Colors.grey.shade300,
                    ),
                  ),
                  child: Row(
                    children: [
                      Text(
                        _selectedDate != null
                            ? "${_selectedDate!.day.toString().padLeft(2, '0')}/${_selectedDate!.month.toString().padLeft(2, '0')}/${_selectedDate!.year}"
                            : "Chọn ngày...",
                        style: TextStyle(
                          color: _selectedDate != null ? AppColors.primary : AppColors.textSecondary,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                      if (_selectedDate != null) ...[
                        const SizedBox(width: 6),
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedDate = null;
                            });
                          },
                          child: const Icon(Icons.close, size: 14, color: AppColors.primary),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: completedWaves.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.history, size: 64, color: AppColors.textSecondary),
                      const SizedBox(height: 12),
                      Text(
                        _selectedDate != null 
                            ? 'Không có đợt hoàn thành nào trong ngày này!'
                            : 'Chưa có đợt hàng nào hoàn thành!',
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 16),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () async => ref.invalidate(wavesProvider),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: completedWaves.length,
                    itemBuilder: (context, index) {
                      final wave = completedWaves[index];
                      return _buildWaveCard(wave, null, isActive: false);
                    },
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildWaveCard(dynamic wave, String? operatorSub, {required bool isActive}) {
    final waveId = wave['id']?.toString() ?? '';
    final waveNo = wave['waveNo']?.toString() ?? 'N/A';
    final orderCount = wave['orderCount'] ?? 0;
    final type = wave['type']?.toString() ?? 'N/A';
    final createdAtStr = wave['createdAt'] != null 
        ? DateTime.parse(wave['createdAt']).toLocal().toString().substring(0, 16)
        : 'N/A';
    final dateParts = createdAtStr.split(' ');
    final dateStr = dateParts[0];
    final timeStr = dateParts.length > 1 ? dateParts[1] : '';
    final assignedTo = wave['assignedTo']?.toString();
    final isAssignedToMe = assignedTo != null && assignedTo == operatorSub;
    final status = wave['status']?.toString() ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          context.push('/wms/pick_tasks/$waveId');
        },
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: isActive 
                        ? AppColors.primary.withOpacity(0.1)
                        : AppColors.success.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.waves, 
                      color: isActive ? AppColors.primary : AppColors.success
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Đợt Nhặt Hàng', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                        Text(
                          waveNo,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary),
                        ),
                      ],
                    ),
                  ),
                  if (isActive)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: isAssignedToMe 
                          ? AppColors.success.withOpacity(0.15) 
                          : AppColors.warning.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        isAssignedToMe ? 'Của tôi' : 'Việc chưa nhận',
                        style: TextStyle(
                          color: isAssignedToMe ? AppColors.success : AppColors.warning,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: status.toLowerCase() == 'completed'
                          ? AppColors.success.withOpacity(0.15)
                          : Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        status.toLowerCase() == 'completed' ? 'Hoàn thành' : 'Đã hủy',
                        style: TextStyle(
                          color: status.toLowerCase() == 'completed' ? AppColors.success : Colors.grey,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                ],
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Divider(),
              ),
              Row(
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        const Icon(Icons.category, size: 16, color: AppColors.textSecondary),
                        const SizedBox(width: 4),
                        Text(type, style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.inventory_2, size: 16, color: AppColors.textSecondary),
                        const SizedBox(width: 4),
                        Text('$orderCount đơn', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        const Icon(Icons.access_time, size: 16, color: AppColors.textSecondary),
                        const SizedBox(width: 4),
                        Text(timeStr, style: const TextStyle(fontSize: 13, color: AppColors.textPrimary)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    dateStr,
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                  Row(
                    children: [
                      Text(
                        isActive ? 'Tiến hành' : 'Xem chi tiết', 
                        style: TextStyle(
                          color: isActive ? AppColors.primary : AppColors.success, 
                          fontWeight: FontWeight.bold
                        )
                      ),
                      const SizedBox(width: 4),
                      Icon(
                        Icons.arrow_forward_ios, 
                        size: 14, 
                        color: isActive ? AppColors.primary : AppColors.success
                      ),
                    ],
                  ),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }
}
