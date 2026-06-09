import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../../core/constants/app_colors.dart';
import '../../qr/services/qr_action_service.dart';
import '../../qr/providers/qr_providers.dart';
import '../../../../../core/widgets/camera_scanner_dialog.dart';
import '../../../../../core/utils/scanner_helper.dart';
import '../../../../../core/error/error_handler.dart';

class ReplenishmentExecutionScreen extends ConsumerStatefulWidget {
  final String taskId;
  final String sku;
  final int quantity;
  final String sourceBin;
  final String destBin;

  const ReplenishmentExecutionScreen({
    super.key,
    required this.taskId,
    required this.sku,
    required this.quantity,
    required this.sourceBin,
    required this.destBin,
  });

  @override
  ConsumerState<ReplenishmentExecutionScreen> createState() => _ReplenishmentExecutionScreenState();
}

class _ReplenishmentExecutionScreenState extends ConsumerState<ReplenishmentExecutionScreen> {
  final TextEditingController _sourceBinController = TextEditingController();
  final TextEditingController _destBinController = TextEditingController();
  
  late final ScannerHelper _scannerHelper;
  bool _isLoading = false;
  int _step = 1; // 1: Lấy hàng từ nguồn, 2: Cất hàng vào đích

  @override
  void initState() {
    super.initState();
    _scannerHelper = ScannerHelper(onCodeScanned: _handleHardwareScan);
  }

  void _handleHardwareScan(String code) {
    String cleanCode = code;
    if (code.startsWith('BIN:')) cleanCode = code.substring(4);
    
    setState(() {
      if (_step == 1) {
        _sourceBinController.text = cleanCode;
      } else {
        _destBinController.text = cleanCode;
      }
    });
  }

  Future<void> _scanSourceBinWithCamera() async {
    final result = await showDialog<String>(
      context: context,
      builder: (context) => const CameraScannerDialog(),
    );
    if (result != null && result.isNotEmpty) {
      String cleanCode = result;
      if (result.startsWith('BIN:')) cleanCode = result.substring(4);
      setState(() {
        _sourceBinController.text = cleanCode;
      });
    }
  }

  Future<void> _scanDestBinWithCamera() async {
    final result = await showDialog<String>(
      context: context,
      builder: (context) => const CameraScannerDialog(),
    );
    if (result != null && result.isNotEmpty) {
      String cleanCode = result;
      if (result.startsWith('BIN:')) cleanCode = result.substring(4);
      setState(() {
        _destBinController.text = cleanCode;
      });
    }
  }

  void _nextStep() {
    final src = _sourceBinController.text.trim();
    if (src.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vui lòng quét Kệ Nguồn!'), backgroundColor: AppColors.warning));
      return;
    }
    if (src != widget.sourceBin) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Kệ nguồn không khớp! Yêu cầu: ${widget.sourceBin}'), backgroundColor: AppColors.error));
      // Cho phép tiếp tục nếu họ cố ý lấy kệ khác? Backend sẽ chặn nếu sai. Ở đây cứ cho phép nhưng cảnh báo.
    }
    setState(() {
      _step = 2;
    });
  }

  Future<void> _submitReplenishment() async {
    final src = _sourceBinController.text.trim();
    final dst = _destBinController.text.trim();
    
    if (src.isEmpty || dst.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('⚠️ Vui lòng quét đầy đủ Kệ Nguồn và Kệ Đích!'),
        backgroundColor: AppColors.warning,
      ));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final qrService = ref.read(qrActionServiceProvider);
      await qrService.confirmReplenish(
        taskId: widget.taskId,
        scannedSourceBin: src,
        scannedDestBin: dst,
      );
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('✅ Bổ sung hàng thành công!'),
          backgroundColor: AppColors.success,
        ));
        context.pop(); // Quay lại màn hình dashboard
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ErrorHandler.showError(context, e);
      }
    }
  }

  void _showShortReplenishDialog() {
    final TextEditingController controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Báo thiếu hàng (Short Replenish)'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Số lượng yêu cầu: ${widget.quantity} PCS'),
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
                if (input == null || input < 0 || input >= widget.quantity) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                    content: Text('⚠️ Số lượng phải từ 0 đến ${widget.quantity - 1}!'),
                    backgroundColor: AppColors.warning,
                  ));
                  return;
                }
                Navigator.pop(context);
                _handleShortReplenish(input);
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
              child: const Text('Xác nhận thiếu'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _handleShortReplenish(int actualQty) async {
    final src = _sourceBinController.text.trim();
    if (src.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('⚠️ Vui lòng quét Kệ Nguồn trước khi báo thiếu!'),
        backgroundColor: AppColors.warning,
      ));
      return;
    }
    setState(() => _isLoading = true);

    try {
      final qrService = ref.read(qrActionServiceProvider);
      // Dùng widget.destBin vì kệ đích chưa được quét ở Bước 1
      await qrService.confirmReplenish(
        taskId: widget.taskId,
        scannedSourceBin: src,
        scannedDestBin: widget.destBin,
        quantity: actualQty,
      );
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('✅ Đã báo thiếu và hoàn tất ($actualQty PCS)!'),
          backgroundColor: AppColors.success,
        ));
        context.pop(); // Quay lại màn hình dashboard
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ErrorHandler.showError(context, e);
      }
    }
  }

  @override
  void dispose() {
    _sourceBinController.dispose();
    _destBinController.dispose();
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
        appBar: AppBar(title: const Text('Thực thi Bổ sung')),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildTaskInfoCard(),
              const SizedBox(height: 24),
              _buildStepper(),
              const SizedBox(height: 24),
              if (_step == 1) _buildSourceStep() else _buildDestStep(),
            ],
          ),
        ),
        bottomNavigationBar: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_step == 1)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12.0),
                  child: OutlinedButton.icon(
                    onPressed: _isLoading ? null : _showShortReplenishDialog,
                    icon: const Icon(Icons.report_problem, color: AppColors.error),
                    label: const Text('BÁO THIẾU HÀNG', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: const BorderSide(color: AppColors.error),
                    ),
                  ),
                ),
              ElevatedButton.icon(
                onPressed: _isLoading ? null : (_step == 1 ? _nextStep : _submitReplenishment),
                icon: _isLoading 
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
                  : Icon(_step == 1 ? Icons.arrow_forward : Icons.check_circle),
                label: Text(_step == 1 ? 'TIẾP TỤC (CẤT HÀNG)' : 'HOÀN TẤT BỔ SUNG'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  backgroundColor: _step == 1 ? AppColors.primary : AppColors.success,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTaskInfoCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Row(
              children: [
                const Icon(Icons.low_priority, color: Colors.teal, size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Tác vụ Bổ sung', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary)),
                      Text('SKU: ${widget.sku}', style: const TextStyle(color: AppColors.textSecondary)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(color: Colors.teal.withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
                  child: Text('${widget.quantity} PCS', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.teal)),
                )
              ],
            ),
            const Divider(height: 24),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Từ Kệ Nguồn', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                      Text(widget.sourceBin, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Đến Kệ Đích', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                      Text(widget.destBin, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepper() {
    return Row(
      children: [
        _buildStepIndicator(1, 'Lấy hàng', _step >= 1),
        Expanded(child: Container(height: 2, color: _step >= 2 ? AppColors.primary : Colors.grey.shade300)),
        _buildStepIndicator(2, 'Cất hàng', _step >= 2),
      ],
    );
  }

  Widget _buildStepIndicator(int stepIndex, String title, bool isActive) {
    return Column(
      children: [
        CircleAvatar(
          radius: 16,
          backgroundColor: isActive ? AppColors.primary : Colors.grey.shade300,
          child: Text('$stepIndex', style: TextStyle(color: isActive ? Colors.white : Colors.grey.shade600, fontSize: 14, fontWeight: FontWeight.bold)),
        ),
        const SizedBox(height: 4),
        Text(title, style: TextStyle(fontSize: 12, color: isActive ? AppColors.primary : Colors.grey.shade600, fontWeight: isActive ? FontWeight.bold : FontWeight.normal)),
      ],
    );
  }

  Widget _buildSourceStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Bước 1: Quét kệ để lấy hàng', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 8),
        const Text('Hãy di chuyển đến kệ nguồn và lấy đúng số lượng yêu cầu.', style: TextStyle(color: AppColors.textSecondary)),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _sourceBinController,
                decoration: InputDecoration(
                  labelText: 'Mã Kệ Nguồn (Yêu cầu: ${widget.sourceBin})',
                  prefixIcon: const Icon(Icons.outbox),
                  border: const OutlineInputBorder(),
                ),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(
              onPressed: _scanSourceBinWithCamera,
              icon: const Icon(Icons.camera_alt),
              style: IconButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.all(14),
              ),
            )
          ],
        ),
      ],
    );
  }

  Widget _buildDestStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Bước 2: Quét kệ đích để cất hàng', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 8),
        const Text('Hãy mang hàng đến kệ đích và quét mã kệ để hoàn tất.', style: TextStyle(color: AppColors.textSecondary)),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _destBinController,
                decoration: InputDecoration(
                  labelText: 'Mã Kệ Đích (Yêu cầu: ${widget.destBin})',
                  prefixIcon: const Icon(Icons.move_to_inbox),
                  border: const OutlineInputBorder(),
                ),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(
              onPressed: _scanDestBinWithCamera,
              icon: const Icon(Icons.camera_alt),
              style: IconButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.all(14),
              ),
            )
          ],
        ),
        const SizedBox(height: 16),
        TextButton.icon(
          onPressed: () => setState(() => _step = 1),
          icon: const Icon(Icons.arrow_back),
          label: const Text('Quay lại Bước 1'),
        )
      ],
    );
  }
}
