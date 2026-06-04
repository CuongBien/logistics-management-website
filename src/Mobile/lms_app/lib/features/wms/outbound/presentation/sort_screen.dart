import 'package:flutter/material.dart';
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

class SortScreen extends ConsumerStatefulWidget {
  const SortScreen({super.key});

  @override
  ConsumerState<SortScreen> createState() => _SortScreenState();
}

class _SortScreenState extends ConsumerState<SortScreen> {
  late final ScannerHelper _scannerHelper;
  final TextEditingController _orderIdController = TextEditingController();

  bool _isLoading = false;
  String _lastScanned = 'Chưa quét kiện hàng nào';
  ScanSortResponse? _lastResponse;

  @override
  void initState() {
    super.initState();
    _scannerHelper = ScannerHelper(onCodeScanned: _handleScan);
  }

  Future<void> _handleScan(String code) async {
    if (code.isEmpty) return;

    setState(() {
      _lastScanned = code;
      _isLoading = true;
    });

    final isOffline = ref.read(isOnlineProvider).value == false;

    if (isOffline) {
      final actionId = DateTime.now().microsecondsSinceEpoch.toString();
      final body = {
        'scannedOrder': code,
      };

      try {
        final queue = ref.read(offlineQueueProvider);
        await queue.enqueue(OfflineAction(
          id: actionId,
          actionType: 'scan-sort',
          endpoint: '/qrcode/actions/scan-sort',
          method: 'POST',
          body: body,
          createdAt: DateTime.now(),
        ));

        ref.read(pendingCountProvider.notifier).set(queue.pendingCount);

        setState(() {
          _isLoading = false;
          _lastResponse = null;
        });

        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('📥 Đã lưu yêu cầu chia chọn ngoại tuyến cho đơn: $code'),
          backgroundColor: AppColors.warning,
        ));
      } catch (e) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('❌ Lỗi lưu ngoại tuyến: $e'),
          backgroundColor: AppColors.error,
        ));
      }
      return;
    }

    try {
      final qrActionService = ref.read(qrActionServiceProvider);
      final response = await qrActionService.scanSort(scannedOrder: code);

      setState(() {
        _isLoading = false;
        _lastResponse = response;
      });

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('✅ Chia chọn thành công kiện hàng: $code'),
        backgroundColor: AppColors.success,
        duration: const Duration(seconds: 2),
      ));
    } catch (e) {
      setState(() => _isLoading = false);
      
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Lỗi chia chọn', style: TextStyle(color: AppColors.error)),
          content: Text(e is QrException ? e.friendlyMessage : e.toString().replaceAll('Exception: ', '')),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Đóng'),
            )
          ],
        ),
      );
    }
  }

  Future<void> _openCameraScanner() async {
    final result = await showDialog<String>(
      context: context,
      builder: (context) => const CameraScannerDialog(),
    );
    if (result != null && result.isNotEmpty) {
      _handleScan(result);
      _orderIdController.clear();
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
              hintText: 'Nhập mã Order ID...',
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
    return KeyboardListener(
      focusNode: _scannerHelper.focusNode,
      onKeyEvent: _scannerHelper.handleKeyEvent,
      autofocus: true,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Chia Chọn (Sort)'),
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
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      const Icon(Icons.compare_arrows, size: 64, color: AppColors.primary),
                      const SizedBox(height: 16),
                      const Text(
                        'CHIA CHỌN KIỆN HÀNG',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primary),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Quét mã vạch trên kiện hàng để hệ thống tự động xác định kho đích và gán vào chuyến xe.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _orderIdController,
                              decoration: const InputDecoration(
                                label: Text('Nhập / Quét Order ID'),
                                border: OutlineInputBorder(),
                              ),
                              onSubmitted: (value) {
                                if (value.isNotEmpty) _handleScan(value.trim());
                                _orderIdController.clear();
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: () {
                              if (_orderIdController.text.isNotEmpty) {
                                _handleScan(_orderIdController.text.trim());
                                _orderIdController.clear();
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                            ),
                            child: const Icon(Icons.send),
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
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              if (_lastResponse != null) ...[
                Card(
                  elevation: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'KẾT QUẢ PHÂN LOẠI CHUYẾN',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary),
                        ),
                        const Divider(),
                        if (_lastResponse!.routing != null) ...[
                          Text('🏁 Đích cuối: ${_lastResponse!.routing!.finalDestination ?? "N/A"}', style: const TextStyle(fontSize: 15)),
                          const SizedBox(height: 4),
                          Text('🚚 Điểm trung chuyển kế: ${_lastResponse!.routing!.nextHop ?? "N/A"}', style: const TextStyle(fontSize: 15)),
                          const SizedBox(height: 8),
                        ],
                        if (_lastResponse!.shipment != null) ...[
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.success.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppColors.success.withOpacity(0.3)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('📦 Lô hàng: ${_lastResponse!.shipment!.shipmentNo}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.success)),
                                const SizedBox(height: 4),
                                Text('📊 Số đơn hiện tại trong lô: ${_lastResponse!.shipment!.currentOrderCount} đơn', style: const TextStyle(fontSize: 14)),
                                Text('ℹ️ Trạng thái lô: ${_lastResponse!.shipment!.status}', style: const TextStyle(fontSize: 14)),
                              ],
                            ),
                          )
                        ],
                      ],
                    ),
                  ),
                ),
              ],

              const Spacer(),
              if (_isLoading)
                const Center(child: CircularProgressIndicator())
              else
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.qr_code_scanner, color: AppColors.primary, size: 32),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Sẵn sàng quét...', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            const SizedBox(height: 4),
                            Text('Lần quét cuối: $_lastScanned', style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
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
                )
            ],
          ),
        ),
      ),
    );
  }
}
