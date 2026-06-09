import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/constants/app_config.dart';
import '../../qr/services/qr_action_service.dart';
import '../../qr/providers/qr_providers.dart';
import '../providers/inventory_provider.dart';
import '../../../../../core/widgets/camera_scanner_dialog.dart';
import '../../../../../core/utils/scanner_helper.dart';
import '../../../../../core/error/error_handler.dart';

class CycleCountExecutionScreen extends ConsumerStatefulWidget {
  final String taskId;
  final String targetBinCode;
  final String targetSku;

  const CycleCountExecutionScreen({
    super.key,
    required this.taskId,
    required this.targetBinCode,
    required this.targetSku,
  });

  @override
  ConsumerState<CycleCountExecutionScreen> createState() => _CycleCountExecutionScreenState();
}

class _CycleCountExecutionScreenState extends ConsumerState<CycleCountExecutionScreen> {
  final TextEditingController _binController = TextEditingController();
  final TextEditingController _skuController = TextEditingController();
  final TextEditingController _qtyController = TextEditingController();
  
  late final ScannerHelper _scannerHelper;
  bool _isLoading = false;
  bool _isBinVerified = false;

  @override
  void initState() {
    super.initState();
    _scannerHelper = ScannerHelper(onCodeScanned: _handleHardwareScan);
  }

  void _handleHardwareScan(String code) {
    String cleanCode = code;
    if (code.startsWith('BIN:')) {
      cleanCode = code.substring(4);
      _binController.text = cleanCode;
      _verifyBin();
    } else if (code.startsWith('SKU:')) {
      cleanCode = code.substring(4);
      _skuController.text = cleanCode;
    } else {
      if (!_isBinVerified) {
        _binController.text = cleanCode;
        _verifyBin();
      } else {
        _skuController.text = cleanCode;
      }
    }
  }

  Future<void> _scanBinWithCamera() async {
    final result = await showDialog<String>(
      context: context,
      builder: (context) => const CameraScannerDialog(),
    );
    if (result != null && result.isNotEmpty) {
      String cleanCode = result;
      if (result.startsWith('BIN:')) cleanCode = result.substring(4);
      _binController.text = cleanCode;
      _verifyBin();
    }
  }

  Future<void> _scanSkuWithCamera() async {
    final result = await showDialog<String>(
      context: context,
      builder: (context) => const CameraScannerDialog(),
    );
    if (result != null && result.isNotEmpty) {
      String cleanCode = result;
      if (result.startsWith('SKU:')) cleanCode = result.substring(4);
      setState(() {
        _skuController.text = cleanCode;
      });
    }
  }

  Future<void> _verifyBin() async {
    final bin = _binController.text.trim();
    if (bin.isEmpty) return;

    if (bin != widget.targetBinCode) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Kệ không khớp! Yêu cầu: ${widget.targetBinCode}'),
        backgroundColor: AppColors.error,
      ));
      return;
    }

    setState(() => _isLoading = true);
    try {
      final qrService = ref.read(qrActionServiceProvider);
      await qrService.cycleCountStart(
        countTaskId: widget.taskId,
        scannedBin: bin,
      );
      
      setState(() {
        _isBinVerified = true;
        _isLoading = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('✅ Đã xác minh ô kệ! Vui lòng đếm số lượng.'),
          backgroundColor: AppColors.success,
        ));
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ErrorHandler.showError(context, e);
      }
    }
  }

  Future<void> _submitCount() async {
    final sku = _skuController.text.trim();
    final qtyStr = _qtyController.text.trim();
    final bin = _binController.text.trim();
    
    if (qtyStr.isEmpty || (widget.targetSku != 'Tất cả' && sku.isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('⚠️ Vui lòng nhập SKU và Số lượng!'),
        backgroundColor: AppColors.warning,
      ));
      return;
    }
    
    final activeWarehouse = ref.read(warehouseContextProvider);
    if (activeWarehouse == null || activeWarehouse.warehouseId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('⚠️ Vui lòng chọn kho làm việc trước!'),
        backgroundColor: AppColors.error,
      ));
      return;
    }
    
    final qty = int.tryParse(qtyStr);
    if (qty == null || qty < 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('❌ Số lượng không hợp lệ!'),
        backgroundColor: AppColors.error,
      ));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final repo = ref.read(inventoryRepositoryProvider);
      await repo.reconcileCycleCount(
        warehouseId: activeWarehouse.warehouseId,
        sku: widget.targetSku != 'Tất cả' ? widget.targetSku : sku,
        binCode: bin,
        countedQuantity: qty,
      );
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('✅ Đã lưu kết quả kiểm kê!'),
          backgroundColor: AppColors.success,
        ));
        context.pop();
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
    _binController.dispose();
    _skuController.dispose();
    _qtyController.dispose();
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
        appBar: AppBar(title: const Text('Thực thi Kiểm kê')),
        body: Padding(
          padding: const EdgeInsets.all(16.0),
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 400),
            transitionBuilder: (Widget child, Animation<double> animation) {
              return SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(1.0, 0.0),
                  end: Offset.zero,
                ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic)),
                child: FadeTransition(opacity: animation, child: child),
              );
            },
            child: !_isBinVerified ? _buildVerifyBinStep() : _buildCountStep(),
          ),
        ),
      ),
    );
  }

  Widget _buildVerifyBinStep() {
    return Container(
      key: const ValueKey('bin_step'),
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3), width: 2),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.fact_check, size: 80, color: AppColors.primary),
          ),
          const SizedBox(height: 32),
          const Text(
            'BƯỚC 1: XÁC MINH KỆ',
            style: TextStyle(
              fontSize: 18, 
              color: AppColors.textSecondary, 
              fontWeight: FontWeight.bold,
              letterSpacing: 2.0
            ),
          ),
          const SizedBox(height: 16),
          Text(
            widget.targetBinCode,
            style: const TextStyle(
              fontSize: 64,
              fontWeight: FontWeight.w900,
              color: AppColors.primary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 48),
          const Text(
            'Quét mã vạch kệ để tiếp tục',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 16),
          ),
          const SizedBox(height: 24),
          if (_isLoading)
            const CircularProgressIndicator()
          else
            OutlinedButton.icon(
              onPressed: _scanBinWithCamera,
              icon: const Icon(Icons.camera_alt),
              label: const Text('Quét bằng Camera'),
            ),
        ],
      ),
    );
  }

  Widget _buildCountStep() {
    return Container(
      key: const ValueKey('count_step'),
      width: double.infinity,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.success.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
            ),
            child: Column(
              children: [
                Text(
                  'Kệ: ${widget.targetBinCode}',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.success),
                ),
                const SizedBox(height: 8),
                if (widget.targetSku == 'Tất cả')
                  TextField(
                    controller: _skuController,
                    decoration: const InputDecoration(
                      hintText: 'Quét SKU để đếm...',
                      prefixIcon: Icon(Icons.qr_code),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
                    ),
                  )
                else
                  Text(
                    'Đếm SKU: ${widget.targetSku}',
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Expanded(
            flex: 2,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4))
                ]
              ),
              child: Center(
                child: Text(
                  _qtyController.text.isEmpty ? '0' : _qtyController.text,
                  style: const TextStyle(fontSize: 72, fontWeight: FontWeight.w900, color: AppColors.primary),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            flex: 4,
            child: _CustomNumpad(
              onKeyTap: (val) => setState(() => _qtyController.text += val),
              onBackspace: () => setState(() {
                if (_qtyController.text.isNotEmpty) {
                  _qtyController.text = _qtyController.text.substring(0, _qtyController.text.length - 1);
                }
              }),
              onSubmit: _submitCount,
              isLoading: _isLoading,
            ),
          ),
        ],
      ),
    );
  }
}

class _CustomNumpad extends StatelessWidget {
  final Function(String) onKeyTap;
  final VoidCallback onBackspace;
  final VoidCallback onSubmit;
  final bool isLoading;

  const _CustomNumpad({
    required this.onKeyTap,
    required this.onBackspace,
    required this.onSubmit,
    this.isLoading = false,
  });

  Widget _buildButton(String text, {Color? color, Color? textColor, VoidCallback? onTap}) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.all(6.0),
        child: Material(
          color: color ?? Colors.grey.shade100,
          borderRadius: BorderRadius.circular(16),
          elevation: 2,
          child: InkWell(
            onTap: onTap ?? () => onKeyTap(text),
            borderRadius: BorderRadius.circular(16),
            child: Center(
              child: Text(
                text, 
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: textColor ?? Colors.black87),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(child: Row(children: ['1','2','3'].map((e) => _buildButton(e)).toList())),
        Expanded(child: Row(children: ['4','5','6'].map((e) => _buildButton(e)).toList())),
        Expanded(child: Row(children: ['7','8','9'].map((e) => _buildButton(e)).toList())),
        Expanded(child: Row(children: [
          _buildButton('C', color: AppColors.error.withValues(alpha: 0.1), textColor: AppColors.error, onTap: onBackspace),
          _buildButton('0'),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(6.0),
              child: Material(
                color: AppColors.success,
                borderRadius: BorderRadius.circular(16),
                elevation: 4,
                child: InkWell(
                  onTap: isLoading ? null : onSubmit,
                  borderRadius: BorderRadius.circular(16),
                  child: Center(
                    child: isLoading 
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Icon(Icons.check, color: Colors.white, size: 40),
                  ),
                ),
              ),
            ),
          ),
        ])),
      ],
    );
  }
}
