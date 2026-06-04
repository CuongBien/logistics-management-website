import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/utils/scanner_helper.dart';
import '../../../../../core/constants/app_colors.dart';
import '../providers/outbound_provider.dart';
import '../../../../../core/widgets/camera_scanner_dialog.dart';
import '../../qr/providers/qr_providers.dart';
import '../../qr/domain/qr_models.dart';
import '../../../../../core/network/offline_queue.dart';
import '../../../../../core/network/connectivity_service.dart';
import '../../../../../core/error/app_exception.dart';
import '../../../../../core/error/error_handler.dart';

class PackOrderScreen extends ConsumerStatefulWidget {
  const PackOrderScreen({super.key});

  @override
  ConsumerState<PackOrderScreen> createState() => _PackOrderScreenState();
}

class _PackOrderScreenState extends ConsumerState<PackOrderScreen> {
  late final ScannerHelper _scannerHelper;
  final TextEditingController _orderIdController = TextEditingController();

  String _orderId = '';
  String _orderNo = '';
  String _address = '';
  List<dynamic> _orderLines = [];
  final Map<String, int> _packedQuantities = {};
  bool _isLoading = false;
  String _lastScannedSku = 'Chưa quét SKU nào';

  @override
  void initState() {
    super.initState();
    _scannerHelper = ScannerHelper(onCodeScanned: _handleScan);
  }

  Future<void> _loadOrder(String orderId) async {
    if (orderId.isEmpty) return;
    setState(() {
      _isLoading = true;
      _packedQuantities.clear();
    });

    try {
      String targetId = orderId;
      try {
        final parsed = await ref.read(qrLookupServiceProvider).parse(rawValue: orderId);
        if (parsed.type == QrType.order || parsed.type == QrType.outboundOrder) {
          targetId = parsed.entityId ?? parsed.data?['waybillCode'] ?? orderId;
        }
      } catch (_) {}

      final repo = ref.read(outboundRepositoryProvider);
      final order = await repo.getOutboundOrder(targetId);

      setState(() {
        _orderId = targetId;
        _orderIdController.text = targetId;
        _orderNo = order['orderNo']?.toString() ?? 'N/A';
        _address = order['destinationAddress']?.toString() ?? 'N/A';
        _orderLines = order['lines'] as List<dynamic>? ?? [];
        
        for (var line in _orderLines) {
          final sku = line['sku']?.toString() ?? '';
          _packedQuantities[sku] = line['packedQty'] ?? 0;
        }
        _isLoading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('✅ Đã tải đơn hàng: $_orderNo'),
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
    if (_isLoading) return;

    if (_orderId.isEmpty) {
      _loadOrder(code);
      return;
    }

    final isOffline = ref.read(isOnlineProvider).value == false;

    if (isOffline) {
      final actionId = DateTime.now().microsecondsSinceEpoch.toString();
      final body = {
        'outboundOrderId': _orderId,
        'scannedSku': code,
        'quantity': 1,
      };

      try {
        final queue = ref.read(offlineQueueProvider);
        await queue.enqueue(OfflineAction(
          id: actionId,
          actionType: 'verify-pack',
          endpoint: '/qrcode/actions/verify-pack',
          method: 'POST',
          body: body,
          createdAt: DateTime.now(),
        ));

        ref.read(pendingCountProvider.notifier).set(queue.pendingCount);

        bool foundSku = false;
        String cleanSku = code;
        if (code.startsWith('SKU:')) {
          cleanSku = code.substring(4);
        }

        setState(() {
          for (var line in _orderLines) {
            final sku = line['sku']?.toString() ?? '';
            if (sku == cleanSku) {
              foundSku = true;
              final targetQty = line['quantity'] ?? 0;
              final currentPacked = _packedQuantities[sku] ?? 0;
              if (currentPacked < targetQty) {
                _packedQuantities[sku] = currentPacked + 1;
                _lastScannedSku = code;
              }
            }
          }
        });

        if (foundSku) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('📥 Đã lưu yêu cầu đóng gói ngoại tuyến SKU: $code'),
            backgroundColor: AppColors.warning,
          ));
        } else {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('❌ SKU $code không thuộc về đơn hàng này!'),
            backgroundColor: AppColors.error,
          ));
        }
      } catch (e) {
        if (mounted) {
          ErrorHandler.showError(context, e);
        }
      }
      return;
    }

    setState(() => _isLoading = true);

    try {
      final qrActionService = ref.read(qrActionServiceProvider);
      final result = await qrActionService.verifyPack(
        outboundOrderId: _orderId,
        scannedSku: code,
        quantity: 1,
      );

      setState(() {
        _isLoading = false;
        _lastScannedSku = code;
        for (var item in result.verifiedItems) {
          _packedQuantities[item.sku] = item.scanned;
        }
        
        if (result.allItemsVerified) {
          _submitPack();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('✅ Đã quét đóng gói SKU: $code'),
            backgroundColor: AppColors.success,
          ));
        }
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ErrorHandler.showError(context, e);
      }
    }
  }

  Future<void> _submitPack() async {
    if (_orderId.isEmpty) return;

    bool isFullyPacked = true;
    for (var line in _orderLines) {
      final sku = line['sku']?.toString() ?? '';
      final target = line['quantity'] ?? 0;
      final current = _packedQuantities[sku] ?? 0;
      if (current < target) {
        isFullyPacked = false;
        break;
      }
    }

    if (!isFullyPacked) {
      final confirm = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Chưa đóng gói đủ hàng?'),
          content: const Text('Một số sản phẩm chưa đóng gói đủ số lượng. Bạn vẫn muốn tiếp tục đóng gói và xuất hóa đơn chứ?'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Hủy')),
            ElevatedButton(onPressed: () => Navigator.pop(context, true), child: const Text('Đồng ý')),
          ],
        ),
      );
      if (confirm != true) return;
    }

    setState(() => _isLoading = true);

    try {
      final repo = ref.read(outboundRepositoryProvider);
      
      await repo.packOrder(_orderId);
      await repo.shipOrder(_orderId);

      setState(() => _isLoading = false);

      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.check_circle, color: AppColors.success, size: 28),
                SizedBox(width: 8),
                Text('Đóng gói & Auto Ship OK'),
              ],
            ),
            content: Text('Đơn hàng $_orderNo đã được Đóng gói thành công!\nHệ thống tự động liên kết và phân phối Shipment để chuyển qua khâu Xuất bến (Dispatch).'),
            actions: [
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.pop(context);
                },
                child: const Text('HOÀN TẤT & IN TEM'),
              )
            ],
          ),
        );
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
              if (value.isNotEmpty) _handleScan(value.trim());
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
                if (controller.text.isNotEmpty) _handleScan(controller.text.trim());
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
    return KeyboardListener(
      focusNode: _scannerHelper.focusNode,
      onKeyEvent: _scannerHelper.handleKeyEvent,
      autofocus: true,
      child: Scaffold(
        appBar: AppBar(title: const Text('Đóng Gói (Pack Order)')),
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
                                labelText: 'Quét / Nhập Order ID đóng gói',
                                prefixIcon: Icon(Icons.inventory_2),
                                border: OutlineInputBorder(),
                              ),
                              onSubmitted: (value) {
                                if (value.isNotEmpty) _loadOrder(value.trim());
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: () {
                              _loadOrder(_orderIdController.text.trim());
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
                      if (_orderNo.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Đơn hàng: $_orderNo',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            Expanded(
                              child: Text(
                                'Đến: $_address',
                                textAlign: TextAlign.right,
                                style: const TextStyle(color: AppColors.textSecondary, overflow: TextOverflow.ellipsis),
                              ),
                            )
                          ],
                        ),
                      ]
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _orderLines.isEmpty
                        ? const Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.qr_code_scanner, size: 64, color: AppColors.textSecondary),
                                SizedBox(height: 8),
                                Text(
                                  'Chưa có dữ liệu đóng gói.\nVui lòng quét Order ID để tải đơn hàng.',
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
                                child: Text(
                                  'Chi tiết đóng gói sản phẩm:',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                              ),
                              Expanded(
                                child: ListView.builder(
                                  itemCount: _orderLines.length,
                                  itemBuilder: (context, index) {
                                    final line = _orderLines[index];
                                    final sku = line['sku']?.toString() ?? 'N/A';
                                    final target = line['quantity'] ?? 0;
                                    final current = _packedQuantities[sku] ?? 0;
                                    final progress = target > 0 ? current / target : 0.0;

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
                                                Text(
                                                  sku,
                                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                                                ),
                                                Text(
                                                  '$current / $target PCS',
                                                  style: TextStyle(
                                                    fontWeight: FontWeight.bold,
                                                    color: current == target ? AppColors.success : AppColors.primary,
                                                  ),
                                                )
                                              ],
                                            ),
                                            const SizedBox(height: 8),
                                            LinearProgressIndicator(
                                              value: progress,
                                              backgroundColor: Colors.grey.shade200,
                                              color: current == target ? AppColors.success : AppColors.primary,
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

              if (_orderId.isNotEmpty) ...[
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
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Sẵn sàng quét SKU để đóng gói...', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                            Text('Quét cuối: $_lastScannedSku', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                          ],
                        ),
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
                const SizedBox(height: 12),
                ElevatedButton.icon(
                  onPressed: _isLoading ? null : _submitPack,
                  icon: const Icon(Icons.check),
                  label: const Text('HOÀN THÀNH ĐÓNG GÓI & SHIP'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.success,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ]
            ],
          ),
        ),
      ),
    );
  }
}
