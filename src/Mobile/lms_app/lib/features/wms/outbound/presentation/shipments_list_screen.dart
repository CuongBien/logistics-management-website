import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_config.dart';
import '../providers/outbound_provider.dart';

class ShipmentsListScreen extends ConsumerWidget {
  const ShipmentsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final shipmentsAsync = ref.watch(shipmentsProvider);
    final activeWarehouse = ref.watch(warehouseContextProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Danh sách Chuyến Xe (Shipments)'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(shipmentsProvider),
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
            child: shipmentsAsync.when(
              data: (shipments) {
                // Lọc shipments chưa xuất bến
                final activeShipments = shipments.where((s) {
                  final status = s['status']?.toString().toLowerCase() ?? '';
                  return status == 'created' || status == 'loading' || status == 'sorted';
                }).toList();

                if (activeShipments.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.local_shipping, size: 64, color: AppColors.textSecondary),
                        SizedBox(height: 12),
                        Text(
                          'Không có chuyến hàng nào đang gom xếp xe!',
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 16),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(shipmentsProvider),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: activeShipments.length,
                    itemBuilder: (context, index) {
                      final shipment = activeShipments[index];
                      final shipmentId = shipment['id']?.toString() ?? '';
                      final shipmentNo = shipment['shipmentNo']?.toString() ?? 'N/A';
                      final carrier = shipment['carrier']?.toString() ?? 'Chưa gán nhà xe';
                      final status = shipment['status']?.toString() ?? 'Created';
                      final orderCount = shipment['orderCount'] ?? 0;
                      final destName = shipment['destinationName'] ?? shipment['destinationId'] ?? 'N/A';

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 2,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () {
                            // Chuyển tới màn hình quét xếp xe xuất bến chi tiết
                            context.push('/wms/dispatch_execution/$shipmentId');
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
                                      'Lô/Chuyến: $shipmentNo',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: status.toLowerCase() == 'loading' 
                                          ? AppColors.primary.withOpacity(0.15)
                                          : AppColors.success.withOpacity(0.15),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(
                                        status,
                                        style: TextStyle(
                                          color: status.toLowerCase() == 'loading' 
                                            ? AppColors.primary
                                            : AppColors.success,
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
                                        const Text('Đơn vị vận chuyển', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                        const SizedBox(height: 2),
                                        Text(carrier, style: const TextStyle(fontWeight: FontWeight.w600)),
                                      ],
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.center,
                                      children: [
                                        const Text('Số lượng đơn', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                        const SizedBox(height: 2),
                                        Text('$orderCount Đơn', style: const TextStyle(fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        const Text('Điểm đến', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                        const SizedBox(height: 2),
                                        Text(destName.toString().length > 15 
                                          ? '${destName.toString().substring(0, 12)}...' 
                                          : destName.toString(), style: const TextStyle(fontWeight: FontWeight.bold)),
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
                        onPressed: () => ref.invalidate(shipmentsProvider),
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
