import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../../core/utils/scanner_helper.dart';
import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/widgets/camera_scanner_dialog.dart';
import '../../qr/providers/qr_providers.dart';
import '../../../../../core/network/offline_queue.dart';
import '../../../../../core/network/connectivity_service.dart';
import '../../../../../core/error/app_exception.dart';
import '../../../../../core/error/error_handler.dart';

class CrossDockScreen extends ConsumerStatefulWidget {
  final String taskId;
  final String targetBin;

  const CrossDockScreen({
    super.key,
    required this.taskId,
    required this.targetBin,
  });

  @override
  ConsumerState<CrossDockScreen> createState() => _CrossDockScreenState();
}

class _CrossDockScreenState extends ConsumerState<CrossDockScreen> {
  late final ScannerHelper _scannerHelper;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _scannerHelper = ScannerHelper(onCodeScanned: _handleScan);
  }

  void _handleScan(String code) async {
    if (_isLoading) return;

    setState(() => _isLoading = true);

    final isOffline = ref.read(isOnlineProvider).value == false;

    if (isOffline) {
      final actionId = DateTime.now().microsecondsSinceEpoch.toString();
      final body = {
        'taskId': widget.taskId,
        'scannedBin': code,
      };

      try {
        final queue = ref.read(offlineQueueProvider);
        await queue.enqueue(OfflineAction(
          id: actionId,
          actionType: 'confirm-crossdock',
          endpoint: '/qrcode/actions/confirm-crossdock',
          method: 'POST',
          body: body,
          createdAt: DateTime.now(),
        ));

        ref.read(pendingCountProvider.notifier).set(queue.pendingCount);

        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('📥 Đã lưu yêu cầu Cross-Dock ngoại tuyến (sẽ đồng bộ khi có mạng)'),
          backgroundColor: AppColors.warning,
        ));

        if (mounted) {
          context.pop();
        }
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
      await qrActionService.confirmCrossDock(
        taskId: widget.taskId,
        scannedBin: code,
      );

      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('✅ Xác nhận hoàn tất Cross-Dock thành công!'),
        backgroundColor: AppColors.success,
      ));

      if (mounted) {
        context.pop();
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
              hintText: 'Nhập mã Vị trí (Bin)...',
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
        appBar: AppBar(title: const Text('Cross-Docking')),
        body: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.error.withOpacity(0.1),
                  border: Border.all(color: AppColors.error, width: 2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Column(
                  children: [
                    Icon(Icons.warning, color: AppColors.error, size: 64),
                    SizedBox(height: 16),
                    Text(
                      'ĐỪNG CẤT LÊN KỆ!',
                      style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.error),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Sản phẩm này đang được chờ gấp cho đơn hàng xuất kho.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 16),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      const Text('MANG ĐẾN CỬA XUẤT BẾN', style: TextStyle(fontSize: 16, color: AppColors.textSecondary)),
                      const SizedBox(height: 8),
                      Text(widget.targetBin, style: const TextStyle(fontSize: 48, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 16),
                      if (_isLoading)
                        const CircularProgressIndicator()
                      else
                        const Column(
                          children: [
                            Icon(Icons.qr_code_scanner, size: 48, color: AppColors.primary),
                            SizedBox(height: 4),
                            Text('Quét mã Bin cửa xuất bến để hoàn tất', style: TextStyle(color: AppColors.textSecondary)),
                          ],
                        ),
                    ],
                  ),
                ),
              ),
              const Spacer(),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _openCameraScanner,
                      icon: const Icon(Icons.camera_alt),
                      label: const Text('Quét Camera'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _showManualInputDialog,
                      icon: const Icon(Icons.keyboard),
                      label: const Text('Nhập thủ công'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
