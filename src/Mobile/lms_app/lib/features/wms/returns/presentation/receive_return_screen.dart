import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/constants/app_colors.dart';
import '../providers/returns_provider.dart';
import '../../../../../core/widgets/camera_scanner_dialog.dart';
import '../../../../../core/utils/scanner_helper.dart';

class ReceiveReturnScreen extends ConsumerStatefulWidget {
  const ReceiveReturnScreen({super.key});

  @override
  ConsumerState<ReceiveReturnScreen> createState() => _ReceiveReturnScreenState();
}

class _ReceiveReturnScreenState extends ConsumerState<ReceiveReturnScreen> {
  final TextEditingController _refIdController = TextEditingController();
  final TextEditingController _skuController = TextEditingController();
  final TextEditingController _qtyController = TextEditingController();
  final TextEditingController _binController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();

  late final ScannerHelper _scannerHelper;
  String _selectedCondition = '1'; // '1': Resellable, '2': Damaged
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _binController.text = 'BIN-RETURN'; // Default location for good stock
    _scannerHelper = ScannerHelper(onCodeScanned: _handleHardwareScan);
  }

  void _handleHardwareScan(String code) {
    if (code.startsWith('SKU:')) {
      _skuController.text = code.substring(4);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('📦 Đã nhận dạng SKU: ${_skuController.text}'),
        backgroundColor: AppColors.success,
      ));
    } else if (code.startsWith('BIN:')) {
      _binController.text = code.substring(4);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('📍 Đã nhận dạng Ô kệ: ${_binController.text}'),
        backgroundColor: AppColors.success,
      ));
    } else if (code.startsWith('ORD:') || code.startsWith('SHP:')) {
      _refIdController.text = code.substring(code.indexOf(':') + 1);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('📄 Đã nhận dạng RMA: ${_refIdController.text}'),
        backgroundColor: AppColors.success,
      ));
    } else {
      if (_refIdController.text.isEmpty) {
        _refIdController.text = code;
      } else {
        _skuController.text = code;
      }
    }
  }

  void _onConditionChanged(String value) {
    setState(() {
      _selectedCondition = value;
      if (value == '1') {
        _binController.text = 'BIN-RETURN';
      } else {
        _binController.text = 'BIN-SCRAP';
      }
    });
  }

  Future<void> _scanRefIdWithCamera() async {
    final result = await showDialog<String>(
      context: context,
      builder: (context) => const CameraScannerDialog(),
    );
    if (result != null && result.isNotEmpty) {
      String cleanCode = result;
      if (result.startsWith('ORD:') || result.startsWith('SHP:')) {
        cleanCode = result.substring(result.indexOf(':') + 1);
      }
      setState(() {
        _refIdController.text = cleanCode;
      });
    }
  }

  Future<void> _scanSkuWithCamera() async {
    final result = await showDialog<String>(
      context: context,
      builder: (context) => const CameraScannerDialog(),
    );
    if (result != null && result.isNotEmpty) {
      String cleanCode = result;
      if (result.startsWith('SKU:')) {
        cleanCode = result.substring(4);
      }
      setState(() {
        _skuController.text = cleanCode;
      });
    }
  }

  Future<void> _submitReturn() async {
    final refId = _refIdController.text.trim();
    final sku = _skuController.text.trim();
    final qtyStr = _qtyController.text.trim();
    final bin = _binController.text.trim();
    final notes = _notesController.text.trim();

    if (refId.isEmpty || sku.isEmpty || qtyStr.isEmpty || bin.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('⚠️ Vui lòng nhập đầy đủ mã, SKU, số lượng và vị trí kệ!'),
        backgroundColor: AppColors.warning,
      ));
      return;
    }

    final qty = int.tryParse(qtyStr);
    if (qty == null || qty <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('❌ Số lượng phải lớn hơn 0!'),
        backgroundColor: AppColors.error,
      ));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final repo = ref.read(returnsRepositoryProvider);
      final success = await repo.processReturnDisposition(
        warehouseId: 'a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', // HCM Mega Hub
        sku: sku,
        quantity: qty,
        condition: int.parse(_selectedCondition),
        targetBinCode: bin,
        referenceId: refId,
        referenceType: 'Shipment',
        notes: notes.isNotEmpty ? notes : null,
      );

      if (success) {
        setState(() {
          _refIdController.clear();
          _skuController.clear();
          _qtyController.clear();
          _notesController.clear();
          _selectedCondition = '1';
          _binController.text = 'BIN-RETURN';
          _isLoading = false;
        });

        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('✅ Đã ghi nhận phân loại hàng hoàn thành công!'),
          backgroundColor: AppColors.success,
        ));
      }
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('❌ Lỗi nhận hàng trả: ${e.toString().replaceAll('Exception: ', '')}'),
        backgroundColor: AppColors.error,
      ));
    }
  }

  @override
  void dispose() {
    _refIdController.dispose();
    _skuController.dispose();
    _qtyController.dispose();
    _binController.dispose();
    _notesController.dispose();
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
        appBar: AppBar(title: const Text('Nhận Hàng Hoàn (Returns)')),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                elevation: 3,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: const [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.assignment_return, color: AppColors.primary, size: 28),
                          SizedBox(width: 8),
                          Text(
                            'Xử lý hàng trả (RMA) - Kho HCM',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          )
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _refIdController,
                      decoration: const InputDecoration(
                        labelText: 'Quét / Nhập mã Shipment / Order (RMA)',
                        prefixIcon: Icon(Icons.receipt_long),
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _scanRefIdWithCamera,
                    icon: const Icon(Icons.camera_alt),
                    style: IconButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.all(14),
                    ),
                  )
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _skuController,
                      decoration: const InputDecoration(
                        labelText: 'Quét / Nhập mã sản phẩm (SKU)',
                        prefixIcon: Icon(Icons.qr_code_scanner),
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _scanSkuWithCamera,
                    icon: const Icon(Icons.camera_alt),
                    style: IconButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.all(14),
                    ),
                  )
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _qtyController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Số lượng trả',
                        prefixIcon: Icon(Icons.numbers),
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _binController,
                      decoration: const InputDecoration(
                        labelText: 'Ô kệ cất hàng',
                        prefixIcon: Icon(Icons.grid_view),
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Text('Tình trạng sản phẩm kiểm tế:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              const SizedBox(height: 8),
              
              // Custom styled selector for premium feel
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => _onConditionChanged('1'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: _selectedCondition == '1' ? AppColors.success.withOpacity(0.12) : Colors.transparent,
                          border: Border.all(color: _selectedCondition == '1' ? AppColors.success : Colors.grey.shade400, width: 2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Column(
                          children: [
                            Icon(Icons.check_circle, color: _selectedCondition == '1' ? AppColors.success : Colors.grey),
                            const SizedBox(height: 4),
                            Text(
                              'Còn tốt',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: _selectedCondition == '1' ? AppColors.success : Colors.grey.shade700,
                              ),
                            )
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: InkWell(
                      onTap: () => _onConditionChanged('2'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: _selectedCondition == '2' ? AppColors.error.withOpacity(0.12) : Colors.transparent,
                          border: Border.all(color: _selectedCondition == '2' ? AppColors.error : Colors.grey.shade400, width: 2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Column(
                          children: [
                            Icon(Icons.cancel, color: _selectedCondition == '2' ? AppColors.error : Colors.grey),
                            const SizedBox(height: 4),
                            Text(
                              'Đã hỏng',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: _selectedCondition == '2' ? AppColors.error : Colors.grey.shade700,
                              ),
                            )
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              TextField(
                controller: _notesController,
                decoration: const InputDecoration(
                  labelText: 'Ghi chú phân loại (QC Notes)',
                  prefixIcon: Icon(Icons.edit_note),
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _isLoading ? null : _submitReturn,
                icon: _isLoading 
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Icon(Icons.check),
                label: const Text('XÁC NHẬN NHẬN HOÀN'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
