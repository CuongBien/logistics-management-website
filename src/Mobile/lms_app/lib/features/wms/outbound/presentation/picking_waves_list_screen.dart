import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_config.dart';
import '../providers/outbound_provider.dart';

class PickingWavesListScreen extends ConsumerWidget {
  const PickingWavesListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wavesAsync = ref.watch(wavesProvider);
    final activeWarehouse = ref.watch(warehouseContextProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Đợt Nhặt Hàng (Picking Waves)'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(wavesProvider),
          ),
        ],
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
                // Lọc waves đang Picking hoặc mới tạo
                final activeWaves = waves.where((w) {
                  final status = w['status']?.toString().toLowerCase() ?? '';
                  return status == 'picking' || status == 'created' || status == 'allocated' || status == 'new';
                }).toList();

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
                      final waveId = wave['id']?.toString() ?? '';
                      final waveNo = wave['waveNo']?.toString() ?? 'N/A';
                      final orderCount = wave['orderCount'] ?? 0;
                      final status = wave['status']?.toString() ?? 'Pending';
                      final type = wave['type']?.toString() ?? 'N/A';
                      final createdAtStr = wave['createdAt'] != null 
                          ? DateTime.parse(wave['createdAt']).toLocal().toString().substring(0, 16)
                          : 'N/A';

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 2,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () {
                            // Chuyển tới danh sách Pick Task chi tiết của Wave
                            context.push('/wms/pick_tasks/$waveId');
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
                                      'Mã đợt: $waveNo',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: status.toLowerCase() == 'picking' 
                                          ? AppColors.primary.withOpacity(0.15)
                                          : Colors.grey.shade200,
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(
                                        status,
                                        style: TextStyle(
                                          color: status.toLowerCase() == 'picking' 
                                            ? AppColors.primary
                                            : Colors.grey.shade700,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('Phân loại Wave', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                        const SizedBox(height: 2),
                                        Text(type, style: const TextStyle(fontWeight: FontWeight.w600)),
                                      ],
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.center,
                                      children: [
                                        const Text('Số lượng đơn', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                        const SizedBox(height: 2),
                                        Text('$orderCount Đơn hàng', style: const TextStyle(fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        const Text('Thời gian tạo', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                        const SizedBox(height: 2),
                                        Text(createdAtStr, style: const TextStyle(fontSize: 13)),
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
    );
  }
}
