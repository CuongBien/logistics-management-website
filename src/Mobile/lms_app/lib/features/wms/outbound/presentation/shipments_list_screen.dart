import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_config.dart';
import '../../../../core/utils/scanner_helper.dart';
import '../../../../core/widgets/camera_scanner_dialog.dart';
import '../providers/outbound_provider.dart';

class ShipmentsListScreen extends ConsumerStatefulWidget {
  const ShipmentsListScreen({super.key});

  @override
  ConsumerState<ShipmentsListScreen> createState() => _ShipmentsListScreenState();
}

class _ShipmentsListScreenState extends ConsumerState<ShipmentsListScreen> {
  late final ScannerHelper _scannerHelper;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _scannerHelper = ScannerHelper(onCodeScanned: _handleScan);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scannerHelper.focusNode.dispose();
    super.dispose();
  }

  void _handleScan(String code) {
    if (code.isEmpty) return;

    final trimmedCode = code.trim();
    // Phân loại mã: nếu bắt đầu bằng SHP: hoặc dài (UUID) và không bắt đầu bằng ORD- hay OB:
    if (trimmedCode.startsWith('SHP:') || 
        (trimmedCode.length >= 36 && !trimmedCode.startsWith('ORD-') && !trimmedCode.startsWith('OB:'))) {
      final shipmentId = trimmedCode.startsWith('SHP:') ? trimmedCode.substring(4) : trimmedCode;
      context.push('/wms/dispatch_execution/$shipmentId');
    } else {
      // Nhận diện là mã đơn hàng xuất kho (lẻ) -> Xếp xe trực tiếp
      context.push('/wms/dispatch_execution/new?initialOrder=$trimmedCode');
    }
  }

  Future<void> _openCameraScanner() async {
    final result = await showDialog<String>(
      context: context,
      builder: (context) => const CameraScannerDialog(),
    );
    if (result != null && result.isNotEmpty) {
      _handleScan(result);
    }
  }

  @override
  Widget build(BuildContext context) {
    final shipmentsAsync = ref.watch(shipmentsProvider);
    final activeWarehouse = ref.watch(warehouseContextProvider);

    return KeyboardListener(
      focusNode: _scannerHelper.focusNode,
      onKeyEvent: _scannerHelper.handleKeyEvent,
      autofocus: true,
      child: Scaffold(
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
              color: AppColors.primary.withValues(alpha: 0.08),
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
            
            // Thanh quét/nhập mã nhanh ngay trên màn hình danh sách
            Card(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _searchController,
                        decoration: const InputDecoration(
                          labelText: 'Quét / Nhập mã chuyến xe hoặc đơn hàng',
                          prefixIcon: Icon(Icons.qr_code_scanner),
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        onSubmitted: (value) {
                          if (value.isNotEmpty) {
                            _handleScan(value.trim());
                            _searchController.clear();
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      onPressed: () {
                        if (_searchController.text.isNotEmpty) {
                          _handleScan(_searchController.text.trim());
                          _searchController.clear();
                        }
                      },
                      icon: const Icon(Icons.search),
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.grey.shade100,
                        padding: const EdgeInsets.all(12),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      onPressed: _openCameraScanner,
                      icon: const Icon(Icons.camera_alt),
                      style: IconButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.all(12),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            Expanded(
              child: shipmentsAsync.when(
                data: (shipments) {
                  // Lọc shipments chưa xuất bến
                  final activeShipments = shipments.where((s) {
                    final status = s['status']?.toString().toLowerCase() ?? '';
                    return status == 'planned' || status == 'loading' || status == 'readytoship';
                  }).toList();

                  if (activeShipments.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.local_shipping, size: 64, color: AppColors.textSecondary),
                          const SizedBox(height: 12),
                          const Text(
                            'Không có chuyến hàng nào đang gom xếp xe!',
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 16),
                          ),
                          const SizedBox(height: 20),
                          ElevatedButton.icon(
                            onPressed: () {
                              context.push('/wms/dispatch_execution/new');
                            },
                            icon: const Icon(Icons.qr_code_scanner),
                            label: const Text('Quét bốc hàng trực tiếp'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                            ),
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

                        return Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              )
                            ],
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: () {
                              context.push('/wms/dispatch_execution/$shipmentId');
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
                                          color: AppColors.primary.withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: const Icon(Icons.local_shipping, color: AppColors.primary),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const Text('Chuyến Xe', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                            Text(
                                              shipmentNo,
                                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: status.toLowerCase() == 'loading' 
                                            ? AppColors.primary.withValues(alpha: 0.15)
                                            : AppColors.success.withValues(alpha: 0.15),
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
                                  const Padding(
                                    padding: EdgeInsets.symmetric(vertical: 12),
                                    child: Divider(),
                                  ),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Row(
                                          children: [
                                            const Icon(Icons.business, size: 16, color: AppColors.textSecondary),
                                            const SizedBox(width: 4),
                                            Expanded(child: Text(carrier, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary))),
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
                                            const Icon(Icons.place, size: 16, color: AppColors.textSecondary),
                                            const SizedBox(width: 4),
                                            Expanded(
                                              child: Text(
                                                destName.toString(),
                                                overflow: TextOverflow.ellipsis,
                                                textAlign: TextAlign.end,
                                                style: const TextStyle(fontSize: 13, color: AppColors.textPrimary, fontWeight: FontWeight.bold),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.end,
                                    children: const [
                                      Text('Mở Xếp Xe', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                                      SizedBox(width: 4),
                                      Icon(Icons.arrow_forward_ios, size: 14, color: AppColors.primary),
                                    ],
                                  )
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
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () {
            context.push('/wms/dispatch_execution/new');
          },
          icon: const Icon(Icons.qr_code_scanner),
          label: const Text('Quét bốc hàng lẻ'),
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
        ),
      ),
    );
  }
}
