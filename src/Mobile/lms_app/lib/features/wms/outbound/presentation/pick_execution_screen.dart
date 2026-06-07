import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/utils/scanner_helper.dart';
import '../../../../../core/constants/app_colors.dart';
import '../providers/outbound_provider.dart';
import '../../../../../core/widgets/camera_scanner_dialog.dart';
import '../../qr/providers/qr_providers.dart';
import '../../../../../core/network/offline_queue.dart';
import '../../../../../core/network/connectivity_service.dart';
import '../../../../../core/error/error_handler.dart';

class PickExecutionScreen extends ConsumerStatefulWidget {
  final String waveId;
  const PickExecutionScreen({super.key, this.waveId = 'WAVE-001'});

  @override
  ConsumerState<PickExecutionScreen> createState() => _PickExecutionScreenState();
}

class _PickExecutionScreenState extends ConsumerState<PickExecutionScreen> {
  late final ScannerHelper _scannerHelper;
  int _currentTaskIndex = 0;
  bool _isBinScanned = false;
  String _scannedBinCode = '';
  
  List<dynamic> _tasks = [];
  bool _isFetching = true;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _scannerHelper = ScannerHelper(onCodeScanned: _handleScan);
    _fetchTasks();
  }
  
  Future<void> _fetchTasks() async {
    try {
      final repo = ref.read(outboundRepositoryProvider);
      final data = await repo.getPickTasksForWave(widget.waveId);
      if (mounted) {
        setState(() {
          _tasks = data;
          _isFetching = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isFetching = false;
        });
      }
    }
  }

  void _handleScan(String code) async {
    if (_tasks.isEmpty || _currentTaskIndex >= _tasks.length) return;
    
    final currentTask = _tasks[_currentTaskIndex];
    final targetBin = currentTask['binCode']?.toString() ?? '';
    final targetSku = currentTask['sku']?.toString() ?? '';
    final taskId = currentTask['taskId']?.toString() ?? '';

    if (!_isBinScanned) {
      String cleanBin = code;
      if (code.startsWith('BIN:')) {
        cleanBin = code.substring(4);
      }
      
      if (cleanBin == targetBin) {
        setState(() {
          _isBinScanned = true;
          _scannedBinCode = code; // Lưu mã thô đã quét
        });
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('✅ Đã đến đúng Kệ! Quét mã Sản phẩm ngay.'),
          backgroundColor: AppColors.success,
        ));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('❌ Sai vị trí kệ. Vui lòng đến $targetBin'),
          backgroundColor: AppColors.error,
        ));
      }
    } else {
      String cleanSku = code;
      if (code.startsWith('SKU:')) {
        cleanSku = code.substring(4);
      }

      if (cleanSku == targetSku) {
        final isOffline = ref.read(isOnlineProvider).value == false;

        if (isOffline) {
          final actionId = DateTime.now().microsecondsSinceEpoch.toString();
          final body = {
            'pickTaskId': taskId,
            'scannedBin': _scannedBinCode,
            'scannedSku': code,
          };

          try {
            final queue = ref.read(offlineQueueProvider);
            await queue.enqueue(OfflineAction(
              id: actionId,
              actionType: 'confirm-pick',
              endpoint: '/qrcode/actions/confirm-pick',
              method: 'POST',
              body: body,
              createdAt: DateTime.now(),
            ));

            ref.read(pendingCountProvider.notifier).set(queue.pendingCount);

            setState(() {
              _currentTaskIndex++;
              _isBinScanned = false;
              _scannedBinCode = '';
            });
            
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
              content: Text('📥 Đã lưu yêu cầu lấy hàng ngoại tuyến (sẽ đồng bộ khi có mạng)'),
              backgroundColor: AppColors.warning,
            ));
          } catch (e) {
            if (mounted) {
              ErrorHandler.showError(context, e);
            }
          }
          return;
        }

        try {
          final qrActionService = ref.read(qrActionServiceProvider);
          await qrActionService.confirmPick(
            pickTaskId: taskId,
            scannedBin: _scannedBinCode,
            scannedSku: code,
          );
          
          setState(() {
            _currentTaskIndex++;
            _isBinScanned = false;
            _scannedBinCode = '';
          });
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('✅ Lấy hàng thành công! Chuyển sang món tiếp theo.'),
            backgroundColor: AppColors.success,
          ));
        } catch (e) {
          if (mounted) {
            ErrorHandler.showError(context, e);
          }
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('❌ Lấy sai sản phẩm! Yêu cầu: $targetSku'),
          backgroundColor: AppColors.error,
        ));
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
              hintText: 'Nhập mã Kệ / SKU...',
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

  void _handleShortPick(int actualQty) async {
    if (_tasks.isEmpty || _currentTaskIndex >= _tasks.length) return;
    final currentTask = _tasks[_currentTaskIndex];
    final taskId = currentTask['taskId']?.toString() ?? '';

    final isOffline = ref.read(isOnlineProvider).value == false;

    if (isOffline) {
      final actionId = DateTime.now().microsecondsSinceEpoch.toString();
      final body = {
        'pickTaskId': taskId,
        'scannedBin': _scannedBinCode,
        'scannedSku': currentTask['sku']?.toString() ?? '',
        'quantity': actualQty,
      };

      try {
        final queue = ref.read(offlineQueueProvider);
        await queue.enqueue(OfflineAction(
          id: actionId,
          actionType: 'confirm-pick',
          endpoint: '/qrcode/actions/confirm-pick',
          method: 'POST',
          body: body,
          createdAt: DateTime.now(),
        ));

        ref.read(pendingCountProvider.notifier).set(queue.pendingCount);

        setState(() {
          _currentTaskIndex++;
          _isBinScanned = false;
          _scannedBinCode = '';
        });
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('📥 Đã lưu yêu cầu báo thiếu hàng ngoại tuyến (sẽ đồng bộ khi có mạng)'),
            backgroundColor: AppColors.warning,
          ));
        }
      } catch (e) {
        if (mounted) {
          ErrorHandler.showError(context, e);
        }
      }
      return;
    }

    try {
      final qrActionService = ref.read(qrActionServiceProvider);
      await qrActionService.confirmPick(
        pickTaskId: taskId,
        scannedBin: _scannedBinCode,
        scannedSku: currentTask['sku']?.toString() ?? '',
        quantity: actualQty,
      );
      
      setState(() {
        _currentTaskIndex++;
        _isBinScanned = false;
        _scannedBinCode = '';
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('✅ Đã xác nhận thiếu hàng (Lấy thực tế: $actualQty PCS).'),
          backgroundColor: AppColors.success,
        ));
      }
    } catch (e) {
      if (mounted) {
        ErrorHandler.showError(context, e);
      }
    }
  }

  void _showShortPickDialog(int maxQty) {
    final TextEditingController controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Báo thiếu hàng (Short Pick)'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Số lượng yêu cầu: $maxQty PCS'),
              const SizedBox(height: 12),
              TextField(
                controller: controller,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Số lượng thực tế lấy được',
                  hintText: 'Nhập số lượng...',
                  border: OutlineInputBorder(),
                ),
                autofocus: true,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Hủy'),
            ),
            ElevatedButton(
              onPressed: () {
                final input = int.tryParse(controller.text.trim());
                if (input == null || input < 0 || input >= maxQty) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                    content: Text('⚠️ Số lượng phải từ 0 đến ${maxQty - 1}!'),
                    backgroundColor: AppColors.warning,
                  ));
                  return;
                }
                Navigator.pop(context);
                _handleShortPick(input);
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
              child: const Text('Xác nhận thiếu'),
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
    if (_isFetching) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_errorMessage.isNotEmpty) {
      return Scaffold(body: Center(child: Text(_errorMessage, style: const TextStyle(color: AppColors.error))));
    }
    if (_tasks.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Trống')),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.inbox, size: 100, color: AppColors.textSecondary),
              SizedBox(height: 16),
              Text('Không tìm thấy dữ liệu lấy hàng!', style: TextStyle(fontSize: 20, color: AppColors.textSecondary)),
              Text('Hoặc mã lệnh này không tồn tại.', style: TextStyle(fontSize: 16, color: AppColors.textSecondary)),
            ],
          ),
        ),
      );
    }
    
    if (_currentTaskIndex >= _tasks.length) {
      return Scaffold(
        appBar: AppBar(title: const Text('Hoàn tất')),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.thumb_up, size: 100, color: AppColors.success),
              SizedBox(height: 16),
              Text('Đã lấy xong toàn bộ hàng!', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      );
    }

    final currentTask = _tasks[_currentTaskIndex];
    final targetBin = currentTask['binCode']?.toString() ?? 'N/A';
    final targetSku = currentTask['sku']?.toString() ?? 'N/A';
    final targetQty = currentTask['quantity'] ?? 1;
    final targetProductName = currentTask['productName']?.toString();
    final targetUom = currentTask['uom']?.toString() ?? 'PCS';

    return KeyboardListener(
      focusNode: _scannerHelper.focusNode,
      onKeyEvent: _scannerHelper.handleKeyEvent,
      autofocus: true,
      child: Scaffold(
        appBar: AppBar(
          title: Text('Lấy Hàng (${_currentTaskIndex + 1}/${_tasks.length})'),
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(4.0),
            child: LinearProgressIndicator(
              value: _tasks.isEmpty ? 0 : (_currentTaskIndex / _tasks.length),
              backgroundColor: Colors.white24,
              color: AppColors.success,
            ),
          ),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                color: !_isBinScanned ? AppColors.warning.withOpacity(0.2) : AppColors.success.withOpacity(0.2),
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      Icon(
                        _isBinScanned ? Icons.check_circle : Icons.location_on,
                        size: 64,
                        color: _isBinScanned ? AppColors.success : AppColors.primary,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _isBinScanned ? 'ĐÃ XÁC NHẬN KỆ' : 'ĐI ĐẾN KỆ',
                        style: const TextStyle(fontSize: 16, color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        targetBin,
                        style: TextStyle(
                          fontSize: 48,
                          fontWeight: FontWeight.bold,
                          color: _isBinScanned ? AppColors.success : AppColors.textPrimary,
                          decoration: _isBinScanned ? TextDecoration.lineThrough : null,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Opacity(
                opacity: _isBinScanned ? 1.0 : 0.4,
                child: Card(
                  elevation: _isBinScanned ? 8 : 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(
                      color: _isBinScanned ? AppColors.warning : Colors.transparent,
                      width: 2,
                    )
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text('SẢN PHẨM CẦN LẤY', style: TextStyle(fontSize: 16, color: AppColors.textSecondary)),
                        const SizedBox(height: 8),
                        if (targetProductName != null)
                          Text(
                            targetProductName,
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                          ),
                        Text(
                          'SKU: $targetSku',
                          style: TextStyle(
                            fontSize: targetProductName != null ? 16 : 24, 
                            fontWeight: targetProductName != null ? FontWeight.normal : FontWeight.bold,
                            color: targetProductName != null ? AppColors.textSecondary : AppColors.textPrimary
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 24),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '$targetQty $targetUom',
                            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppColors.primary),
                            textAlign: TextAlign.center,
                          ),
                        ),const SizedBox(height: 24),
                        OutlinedButton.icon(
                          onPressed: _isBinScanned ? () => _showShortPickDialog(targetQty) : null,
                          icon: const Icon(Icons.report_problem),
                          label: const Text('Báo lỗi (Thiếu hàng / Hư hỏng)'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.error,
                            side: const BorderSide(color: AppColors.error),
                          ),
                        )
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        floatingActionButton: Column(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            FloatingActionButton(
              heroTag: 'camera',
              onPressed: _openCameraScanner,
              tooltip: 'Quét Camera',
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              child: const Icon(Icons.camera_alt),
            ),
            const SizedBox(height: 16),
            FloatingActionButton(
              heroTag: 'keyboard',
              onPressed: _showManualInputDialog,
              tooltip: 'Nhập mã thủ công',
              child: const Icon(Icons.keyboard),
            ),
          ],
        ),
      ),
    );
  }
}
