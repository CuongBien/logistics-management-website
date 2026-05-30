import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/utils/scanner_helper.dart';
import '../../../../../core/constants/app_colors.dart';
import '../providers/outbound_provider.dart';

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
      if (code == targetBin) {
        setState(() {
          _isBinScanned = true;
        });
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✅ Đã đến đúng Kệ! Quét mã Sản phẩm ngay.'), backgroundColor: AppColors.success));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('❌ Sai vị trí kệ. Vui lòng đến $targetBin'), backgroundColor: AppColors.error));
      }
    } else {
      if (code == targetSku) {
        try {
          final repo = ref.read(outboundRepositoryProvider);
          await repo.confirmPickTask(taskId);
          
          setState(() {
            _currentTaskIndex++;
            _isBinScanned = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✅ Lấy hàng thành công! Chuyển sang món tiếp theo.'), backgroundColor: AppColors.success));
        } catch (e) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('❌ Lỗi API: $e'), backgroundColor: AppColors.error));
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('❌ Lấy sai sản phẩm! Yêu cầu: $targetSku'), backgroundColor: AppColors.error));
      }
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

    return KeyboardListener(
      focusNode: _scannerHelper.focusNode,
      onKeyEvent: _scannerHelper.handleKeyEvent,
      autofocus: true,
      child: Scaffold(
        appBar: AppBar(title: const Text('Lấy Hàng (Pick Task)')),
        body: Padding(
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
                      children: [
                        const Icon(Icons.inventory_2, size: 64, color: AppColors.warning),
                        const SizedBox(height: 16),
                        const Text('SẢN PHẨM CẦN LẤY', style: TextStyle(fontSize: 16, color: AppColors.textSecondary)),
                        const SizedBox(height: 8),
                        Text(
                          targetSku,
                          style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 8),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'SL: $targetQty',
                            style: const TextStyle(fontSize: 48, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                        ),
                        const SizedBox(height: 24),
                        OutlinedButton.icon(
                          onPressed: _isBinScanned ? () {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đã báo lỗi Short Pick!')));
                          } : null,
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
        floatingActionButton: FloatingActionButton(
          onPressed: _showManualInputDialog,
          tooltip: 'Nhập mã thủ công',
          child: const Icon(Icons.keyboard),
        ),
      ),
    );
  }
}
