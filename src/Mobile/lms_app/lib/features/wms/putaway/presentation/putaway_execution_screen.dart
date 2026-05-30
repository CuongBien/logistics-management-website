import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../../core/utils/scanner_helper.dart';
import '../../../../../core/constants/app_colors.dart';
import '../providers/putaway_provider.dart';

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

  @override
  void initState() {
    super.initState();
    _scannerHelper = ScannerHelper(onCodeScanned: _handleScan);
  }

  void _handleScan(String code) async {
    if (_isLoading) return;
    
    if (code != widget.targetBin) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('❌ Sai vị trí! Vui lòng cất vào ô: ${widget.targetBin}'),
        backgroundColor: AppColors.error,
      ));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final repo = ref.read(putawayRepositoryProvider);
      await repo.completePutawayTask(
        taskId: widget.taskId,
        scannedBinCode: code,
      );
      
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('✅ Đã xác nhận cất hàng thành công!'),
        backgroundColor: AppColors.success,
      ));
      
      // Quay lại màn hình trước đó
      if (context.mounted) {
        context.pop();
      }
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('❌ $e'),
        backgroundColor: AppColors.error,
      ));
    }
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
        body: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
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
            ],
          ),
        ),
      ),
    );
  }
}
