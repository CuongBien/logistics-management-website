import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/utils/scanner_helper.dart';
import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/widgets/camera_scanner_dialog.dart';
import '../../qr/providers/qr_providers.dart';
import '../../../../../core/network/offline_queue.dart';
import '../../../../../core/network/connectivity_service.dart';
import '../../../../../core/error/error_handler.dart';

class ShipReleaseScreen extends ConsumerStatefulWidget {
  const ShipReleaseScreen({super.key});

  @override
  ConsumerState<ShipReleaseScreen> createState() => _ShipReleaseScreenState();
}

class _ShipReleaseScreenState extends ConsumerState<ShipReleaseScreen> {
  late final ScannerHelper _scannerHelper;
  final TextEditingController _inputController = TextEditingController();

  bool _isLoading = false;
  String _lastScanned = 'Chưa quét';

  @override
  void initState() {
    super.initState();
    _scannerHelper = ScannerHelper(onCodeScanned: _handleScan);
  }

  void _handleScan(String code) async {
    if (_isLoading || code.isEmpty) return;
    
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
          actionType: 'ship-and-release',
          endpoint: '/qrcode/actions/ship-and-release',
          method: 'POST',
          body: body,
          createdAt: DateTime.now(),
        ));

        ref.read(pendingCountProvider.notifier).set(queue.pendingCount);

        setState(() {
          _isLoading = false;
        });

        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('📥 Đã lưu ngoại tuyến xuất lẻ đơn hàng: $code'),
          backgroundColor: AppColors.warning,
        ));
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
      await qrActionService.shipAndRelease(
        scannedOrder: code,
      );

      setState(() {
        _isLoading = false;
      });

      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.check_circle, color: AppColors.success, size: 28),
                SizedBox(width: 8),
                Text('Xuất kho thành công!'),
              ],
            ),
            content: Text('Đơn hàng $code đã được xuất và giải phóng ô kệ thành công.'),
            actions: [
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                },
                child: const Text('XÁC NHẬN'),
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

  @override
  void dispose() {
    _inputController.dispose();
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
        appBar: AppBar(title: const Text('Xuất Lẻ (Ship & Release)')),
        body: SingleChildScrollView(
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
                      const Icon(Icons.outbox, size: 64, color: AppColors.primary),
                      const SizedBox(height: 16),
                      const Text(
                        'XUẤT NHANH ĐƠN LẺ',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primary),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Quét đơn hàng để bàn giao trực tiếp cho Courier và tự động giải phóng kệ Wall.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _inputController,
                              decoration: const InputDecoration(
                                labelText: 'Quét Order ID',
                                prefixIcon: Icon(Icons.qr_code_scanner),
                                border: OutlineInputBorder(),
                              ),
                              onSubmitted: (value) {
                                if (value.isNotEmpty) {
                                  _handleScan(value.trim());
                                  _inputController.clear();
                                }
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: () {
                              if (_inputController.text.isNotEmpty) {
                                _handleScan(_inputController.text.trim());
                                _inputController.clear();
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
              const SizedBox(height: 32),
              
              if (_isLoading)
                const Center(child: Padding(padding: EdgeInsets.all(32.0), child: CircularProgressIndicator()))
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
