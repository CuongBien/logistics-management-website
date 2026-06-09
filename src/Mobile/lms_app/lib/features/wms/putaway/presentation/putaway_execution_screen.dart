import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lms_app/core/utils/scanner_helper.dart';
import 'package:lms_app/core/constants/app_colors.dart';
import 'package:lms_app/core/widgets/camera_scanner_dialog.dart';
import 'package:lms_app/features/wms/qr/providers/qr_providers.dart';
import 'package:lms_app/core/network/offline_queue.dart';
import 'package:lms_app/core/network/connectivity_service.dart';
import 'package:lms_app/core/error/error_handler.dart';
import 'package:lms_app/core/error/app_exception.dart';
import 'package:lms_app/core/constants/app_config.dart';
import 'package:lms_app/features/wms/putaway/providers/putaway_provider.dart';

class PutawayExecutionScreen extends ConsumerStatefulWidget {
  final String taskId;
  final String targetBin;

  const PutawayExecutionScreen({
    super.key,
    required this.taskId,
    required this.targetBin,
  });

  @override
  ConsumerState<PutawayExecutionScreen> createState() => _PutawayExecutionScreenState();
}

class _PutawayExecutionScreenState extends ConsumerState<PutawayExecutionScreen> {
  late final ScannerHelper _scannerHelper;
  bool _isLoading = false;
  bool _isLoadingTask = true;
  Map<String, dynamic>? _taskDetails;

  @override
  void initState() {
    super.initState();
    _scannerHelper = ScannerHelper(onCodeScanned: _handleScan);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadTaskDetails();
    });
  }

  Future<void> _loadTaskDetails() async {
    setState(() => _isLoadingTask = true);
    try {
      final activeWarehouse = ref.read(warehouseContextProvider);
      if (activeWarehouse == null || activeWarehouse.warehouseId.isEmpty) {
        throw AppException('Vui lòng chọn kho làm việc trước khi cất hàng!', code: 'Warehouse.Required');
      }

      final repo = ref.read(putawayRepositoryProvider);
      final tasks = await repo.getPutawayTasks(activeWarehouse.warehouseId);
      final task = tasks.firstWhere(
        (t) => t['id'] == widget.taskId,
        orElse: () => null,
      );

      if (mounted) {
        setState(() {
          _taskDetails = task != null ? Map<String, dynamic>.from(task as Map) : null;
          _isLoadingTask = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingTask = false);
        ErrorHandler.showError(context, e);
      }
    }
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
          actionType: 'confirm-putaway',
          endpoint: '/qrcode/actions/confirm-putaway',
          method: 'POST',
          body: body,
          createdAt: DateTime.now(),
        ));
        
        ref.read(pendingCountProvider.notifier).set(queue.pendingCount);

        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('📥 Đã lưu yêu cầu cất hàng ngoại tuyến (sẽ đồng bộ khi có mạng)'),
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
      await qrActionService.confirmPutaway(
        taskId: widget.taskId,
        scannedBin: code,
      );
      
      HapticFeedback.lightImpact();
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('✅ Đã xác nhận cất hàng thành công!'),
        backgroundColor: AppColors.success,
      ));
      
      if (mounted) {
        context.pop();
      }
    } catch (e) {
      HapticFeedback.vibrate();
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
        appBar: AppBar(title: const Text('Cất Hàng (Putaway)')),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_isLoadingTask)
                const Center(child: CircularProgressIndicator())
              else if (_taskDetails == null)
                Card(
                  color: AppColors.error.withOpacity(0.1),
                  child: const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Text('Không tìm thấy thông tin công việc. Bạn vui lòng quay lại hoặc quét lại mã.', style: TextStyle(color: AppColors.error)),
                  ),
                )
              else
                Card(
                  elevation: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('SẢN PHẨM CẦN CẤT', style: TextStyle(fontSize: 14, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Text(
                          _taskDetails!['sku'] ?? 'N/A',
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                        if (_taskDetails!['productName'] != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            _taskDetails!['productName'],
                            style: const TextStyle(fontSize: 16, color: AppColors.textSecondary),
                          ),
                        ],
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Số lượng', style: TextStyle(color: AppColors.textSecondary)),
                                Text(
                                  '${_taskDetails!['quantity'] ?? 0} ${_taskDetails!['uom'] ?? _taskDetails!['uOM'] ?? 'PCS'}',
                                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary),
                                ),
                              ],
                            ),
                            if (_taskDetails!['lotNo'] != null)
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  const Text('Số Lô (Lot)', style: TextStyle(color: AppColors.textSecondary)),
                                  Text(
                                    _taskDetails!['lotNo'],
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                                  ),
                                ],
                              ),
                          ],
                        )
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 16),

              Card(
                color: AppColors.warning.withOpacity(0.2),
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      const Text('CẤT HÀNG VÀO VỊ TRÍ NÀY', style: TextStyle(fontSize: 18, color: AppColors.textSecondary)),
                      Text(
                        widget.targetBin,
                        style: const TextStyle(fontSize: 48, fontWeight: FontWeight.bold, letterSpacing: 2),
                      ),
                      const SizedBox(height: 16),
                      if (_isLoading)
                        const CircularProgressIndicator()
                      else
                        const Column(
                          children: [
                            Icon(Icons.qr_code_scanner, size: 64, color: AppColors.primary),
                            Text('Quét mã Vị trí (Bin) để xác nhận', style: TextStyle(color: AppColors.textSecondary)),
                          ],
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
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
