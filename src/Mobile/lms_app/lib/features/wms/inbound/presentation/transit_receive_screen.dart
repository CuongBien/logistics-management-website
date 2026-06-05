import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/utils/scanner_helper.dart';
import '../../../../../core/constants/app_colors.dart';
import '../providers/inbound_provider.dart';
import '../../../../../core/widgets/camera_scanner_dialog.dart';
import '../../qr/providers/qr_providers.dart';
import '../../qr/domain/qr_models.dart';
import '../../../../../core/network/offline_queue.dart';
import '../../../../../core/network/connectivity_service.dart';
import '../../../../../core/error/app_exception.dart';
import '../../../../../core/error/error_handler.dart';
import '../../../../../core/constants/app_config.dart';

class TransitReceiveScreen extends ConsumerStatefulWidget {
  const TransitReceiveScreen({super.key});

  @override
  ConsumerState<TransitReceiveScreen> createState() => _TransitReceiveScreenState();
}

class _TransitReceiveScreenState extends ConsumerState<TransitReceiveScreen> {
  late final ScannerHelper _scannerHelper;
  final TextEditingController _orderIdController = TextEditingController();

  String _orderId = '';
  String _receiptId = '';
  String _receiptNo = '';
  String _status = '';
  List<dynamic> _receiptLines = [];
  bool _isLoading = false;
  
  final Map<String, int> _scannedItems = {};
  
  final String _defaultBinCode = 'BIN-TRANSIT-01';

  TransitReceiveResponse? _lastResponse;

  @override
  void initState() {
    super.initState();
    _scannerHelper = ScannerHelper(onCodeScanned: _handleScan);
  }

  Future<void> _loadReceipt(String orderId) async {
    if (orderId.isEmpty) return;
    setState(() {
      _isLoading = true;
      _scannedItems.clear();
      _lastResponse = null;
    });

    try {
      String targetId = orderId;
      try {
        final parsed = await ref.read(qrLookupServiceProvider).parse(rawValue: orderId);
        if (parsed.type == QrType.order || parsed.type == QrType.receipt || parsed.type == QrType.outboundOrder) {
          targetId = parsed.entityId ?? parsed.data?['waybillCode'] ?? orderId;
        }
      } catch (_) {}

      final repo = ref.read(inboundRepositoryProvider);
      final receipt = await repo.getReceiptByOrderId(targetId);
      
      setState(() {
        _orderId = targetId;
        _receiptId = receipt['id']?.toString() ?? '';
        _receiptNo = receipt['receiptNo']?.toString() ?? 'N/A';
        _status = receipt['status']?.toString() ?? 'Pending';
        _receiptLines = receipt['lines'] as List<dynamic>? ?? [];
        _isLoading = false;
        
        for (var line in _receiptLines) {
          final sku = line['skuCode'] ?? line['sku'] ?? 'N/A';
          _scannedItems[sku] = 0;
        }
      });

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('✅ Đã tải phiếu luân chuyển: $_receiptNo'),
        backgroundColor: AppColors.success,
      ));
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ErrorHandler.showError(context, e);
      }
    }
  }

  void _handleScan(String code) async {
    if (_orderId.isEmpty || _receiptId.isEmpty) {
      _orderIdController.text = code;
      _loadReceipt(code);
      return;
    }

    setState(() {
      String cleanSku = code;
      if (code.startsWith('SKU:')) {
        cleanSku = code.substring(4);
      }

      if (_scannedItems.containsKey(cleanSku)) {
        var line = _receiptLines.firstWhere(
            (l) => (l['skuCode'] ?? l['sku']) == cleanSku,
            orElse: () => null);
            
        if (line != null) {
            int expected = line['expectedQuantity'] ?? line['expectedQty'] ?? 0;
            int received = line['receivedQuantity'] ?? line['receivedQty'] ?? 0;
            int currentScanned = _scannedItems[cleanSku]!;
            
            if (received + currentScanned < expected) {
                _scannedItems[cleanSku] = currentScanned + 1;
            } else {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                  content: Text('⚠️ SKU $cleanSku đã nhận đủ số lượng!'),
                  backgroundColor: AppColors.warning,
                ));
            }
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('❌ SKU $cleanSku không có trong phiếu luân chuyển này!'),
          backgroundColor: AppColors.error,
        ));
      }
    });
  }

  Future<void> _confirmTransitReceive() async {
    final itemsToReceive = Map<String, int>.from(_scannedItems)..removeWhere((k, v) => v == 0);
    
    if (itemsToReceive.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('⚠️ Chưa quét sản phẩm nào để nhận!'),
        backgroundColor: AppColors.warning,
      ));
      return;
    }

    setState(() => _isLoading = true);

    final isOffline = ref.read(isOnlineProvider).value == false;

    final activeWarehouse = ref.read(warehouseContextProvider);
    if (activeWarehouse == null || activeWarehouse.warehouseId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('⚠️ Vui lòng chọn kho làm việc trước khi thực hiện!'),
        backgroundColor: AppColors.error,
      ));
      setState(() => _isLoading = false);
      return;
    }
    final warehouseId = activeWarehouse.warehouseId;

    if (isOffline) {
      final actionId = DateTime.now().microsecondsSinceEpoch.toString();
      final body = {
        'scannedOrder': _orderId,
        'warehouseId': warehouseId,
        'scannedBin': _defaultBinCode,
        'receivedItems': itemsToReceive,
      };

      try {
        final queue = ref.read(offlineQueueProvider);
        await queue.enqueue(OfflineAction(
          id: actionId,
          actionType: 'transit-receive',
          endpoint: '/qrcode/actions/transit-receive',
          method: 'POST',
          body: body,
          createdAt: DateTime.now(),
        ));
        
        ref.read(pendingCountProvider.notifier).set(queue.pendingCount);

        setState(() {
          _isLoading = false;
          _scannedItems.clear();
        });
        
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('📥 Đã lưu yêu cầu nhận luân chuyển ngoại tuyến (sẽ đồng bộ khi có mạng)'),
          backgroundColor: AppColors.warning,
        ));
        
        await _loadReceipt(_orderId);
      } catch (e) {
        setState(() => _isLoading = false);
        if (mounted) {
          ErrorHandler.showError(context, e);
        }
      }
      return;
    }
    
    try {
      final qrActionService = ref.read(qrActionServiceProvider);
      final response = await qrActionService.transitReceive(
        scannedOrder: _orderId,
        warehouseId: warehouseId,
        scannedBin: _defaultBinCode,
        receivedItems: itemsToReceive,
      );

      setState(() {
        _lastResponse = response;
      });

      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('✅ Nhận hàng luân chuyển thành công!'),
        backgroundColor: AppColors.success,
      ));
      
      await _loadReceipt(_orderId);

      if (response.discrepancy != null && response.discrepancy!.hasDiscrepancy) {
        final disc = response.discrepancy!;
        String discMsg = 'Đã phát hiện lệch hàng khi nhận chuyển kho:\n';
        for (var item in disc.items) {
          discMsg += '• SKU ${item.sku}: Gửi ${item.shipped} - Nhận ${item.received} (Thiếu ${item.shortage})\n';
        }
        
        if (mounted) {
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: const Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 28),
                  SizedBox(width: 8),
                  Text('Chênh Lệch Hàng Hóa'),
                ],
              ),
              content: Text(discMsg),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Đã hiểu'),
                ),
              ],
            ),
          );
        }
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ErrorHandler.showError(context, e);
      }
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

  void _showManualInputDialog() {
    final TextEditingController controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Nhập mã thủ công'),
          content: TextField(
            controller: controller,
            decoration: const InputDecoration(
              hintText: 'Nhập mã Order ID / SKU...',
              border: OutlineInputBorder(),
            ),
            autofocus: true,
            onSubmitted: (value) {
              Navigator.pop(context);
              if (value.isNotEmpty) _handleScan(value);
            },
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Hủy'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                if (controller.text.isNotEmpty) _handleScan(controller.text);
              },
              child: const Text('Xác nhận'),
            ),
          ],
        );
      },
    );
  }

  @override
  void dispose() {
    _orderIdController.dispose();
    _scannerHelper.focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    bool hasScannedAny = _scannedItems.values.any((qty) => qty > 0);

    return KeyboardListener(
      focusNode: _scannerHelper.focusNode,
      onKeyEvent: _scannerHelper.handleKeyEvent,
      autofocus: true,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Nhận Hàng Luân Chuyển'),
        ),
        body: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                elevation: 4,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _orderIdController,
                              decoration: const InputDecoration(
                                labelText: 'Quét / Nhập Inbound Order ID',
                                prefixIcon: Icon(Icons.compare_arrows),
                                border: OutlineInputBorder(),
                              ),
                              onSubmitted: (value) {
                                if (value.isNotEmpty) _loadReceipt(value.trim());
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: () {
                              _loadReceipt(_orderIdController.text.trim());
                            },
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                            ),
                            child: const Icon(Icons.search),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: _openCameraScanner,
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                            ),
                            child: const Icon(Icons.camera_alt),
                          ),
                        ],
                      ),
                      if (_receiptNo.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Số phiếu: $_receiptNo', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text('Trạm: $_defaultBinCode', style: const TextStyle(color: AppColors.primary)),
                            )
                          ],
                        ),
                      ]
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              if (_lastResponse != null) ...[
                Card(
                  color: AppColors.info.withOpacity(0.15),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: AppColors.info, width: 2),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.directions, color: AppColors.info, size: 28),
                            SizedBox(width: 8),
                            Text(
                              'ĐIỀU HƯỚNG TIẾP THEO',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.info),
                            )
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Hành động đề xuất: ${_lastResponse!.nextAction}\n'
                          'Đích cuối: ${_lastResponse!.isFinalDestination ? "Đây là kho nhận cuối cùng" : "Kho trung chuyển"}',
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _receiptLines.isEmpty
                        ? const Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.qr_code_scanner, size: 64, color: AppColors.textSecondary),
                                SizedBox(height: 8),
                                Text(
                                  'Chưa có dữ liệu phiếu.\nVui lòng quét mã Order ID để tải.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: AppColors.textSecondary),
                                )
                              ],
                            ),
                          )
                        : Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 4.0, vertical: 8.0),
                                child: Text('Chi tiết sản phẩm cần nhận:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                              ),
                              Expanded(
                                child: ListView.builder(
                                  itemCount: _receiptLines.length,
                                  itemBuilder: (context, index) {
                                    final line = _receiptLines[index];
                                    final expected = line['expectedQuantity'] ?? line['expectedQty'] ?? 0;
                                    final received = line['receivedQuantity'] ?? line['receivedQty'] ?? 0;
                                    final sku = line['skuCode'] ?? line['sku'] ?? 'N/A';
                                    
                                    final currentScanned = _scannedItems[sku] ?? 0;
                                    final totalReceived = received + currentScanned;
                                    final progress = expected > 0 ? totalReceived / expected : 0.0;

                                    return Card(
                                      margin: const EdgeInsets.only(bottom: 12),
                                      child: Padding(
                                        padding: const EdgeInsets.all(12.0),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Text(sku, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                                                Text(
                                                  '$totalReceived / $expected PCS',
                                                  style: TextStyle(
                                                    fontWeight: FontWeight.bold,
                                                    color: totalReceived >= expected ? AppColors.success : AppColors.primary,
                                                  ),
                                                )
                                              ],
                                            ),
                                            if (currentScanned > 0)
                                              Padding(
                                                padding: const EdgeInsets.only(top: 4.0),
                                                child: Text('+ $currentScanned (mới quét)', style: const TextStyle(color: Colors.orange, fontSize: 13, fontWeight: FontWeight.bold)),
                                              ),
                                            const SizedBox(height: 8),
                                            LinearProgressIndicator(
                                              value: progress,
                                              backgroundColor: Colors.grey.shade200,
                                              color: totalReceived >= expected ? AppColors.success : AppColors.primary,
                                              minHeight: 8,
                                            ),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ],
                          ),
              ),

              if (_receiptId.isNotEmpty && _status != 'Closed' && _status != '2') ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.center_focus_strong, color: AppColors.primary, size: 28),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text('Đang đợi quét SKU...', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      ),
                      IconButton(
                        icon: const Icon(Icons.camera_alt, color: AppColors.primary),
                        onPressed: _openCameraScanner,
                      ),
                      IconButton(
                        icon: const Icon(Icons.keyboard, color: AppColors.primary),
                        onPressed: _showManualInputDialog,
                      )
                    ],
                  ),
                ),
                if (hasScannedAny) ...[
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _confirmTransitReceive,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: AppColors.success,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('XÁC NHẬN NHẬN HÀNG', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ]
              ]
            ],
          ),
        ),
      ),
    );
  }
}
