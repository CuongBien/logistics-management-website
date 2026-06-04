import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/constants/app_colors.dart';
import '../providers/inventory_provider.dart';
import '../../../../../core/widgets/camera_scanner_dialog.dart';
import '../../../../../core/utils/scanner_helper.dart';

class CycleCountScreen extends ConsumerStatefulWidget {
  const CycleCountScreen({super.key});

  @override
  ConsumerState<CycleCountScreen> createState() => _CycleCountScreenState();
}

class _CycleCountScreenState extends ConsumerState<CycleCountScreen> {
  final TextEditingController _skuController = TextEditingController();
  final TextEditingController _qtyController = TextEditingController();
  final TextEditingController _binController = TextEditingController();
  
  late final ScannerHelper _scannerHelper;
  bool _isLoading = false;
  final String _warehouseId = 'a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'; // HCM Mega Hub

  @override
  void initState() {
    super.initState();
    _scannerHelper = ScannerHelper(onCodeScanned: _handleHardwareScan);
  }

  void _handleHardwareScan(String code) {
    // Tự động phân loại dựa trên nội dung mã quét được từ máy quét phần cứng
    if (code.startsWith('BIN:')) {
      _binController.text = code.substring(4);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('📍 Đã nhận dạng Kệ: ${_binController.text}'),
        backgroundColor: AppColors.success,
      ));
    } else if (code.startsWith('SKU:')) {
      _skuController.text = code.substring(4);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('📦 Đã nhận dạng SKU: ${_skuController.text}'),
        backgroundColor: AppColors.success,
      ));
    } else {
      // Nếu không có prefix, kiểm tra xem trường nào đang được focus để điền vào
      if (_binController.text.isEmpty) {
        _binController.text = code;
      } else {
        _skuController.text = code;
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
      if (result.startsWith('BIN:')) {
        cleanCode = result.substring(4);
      }
      setState(() {
        _binController.text = cleanCode;
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

  Future<void> _submitCount() async {
    final sku = _skuController.text.trim();
    final qtyStr = _qtyController.text.trim();
    final bin = _binController.text.trim();
    
    if (sku.isEmpty || qtyStr.isEmpty || bin.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('⚠️ Vui lòng nhập đầy đủ Ô Kệ, SKU và Số lượng!'),
        backgroundColor: AppColors.warning,
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
        warehouseId: _warehouseId,
        sku: sku,
        binCode: bin,
        countedQuantity: qty,
      );
      
      setState(() {
        _skuController.clear();
        _qtyController.clear();
        _binController.clear();
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('✅ Đã lưu kết quả kiểm kê thật vào CSDL PostgreSQL!'),
        backgroundColor: AppColors.success,
      ));
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('❌ Lỗi kiểm kê: ${e.toString().replaceAll('Exception: ', '')}'),
        backgroundColor: AppColors.error,
      ));
    }
  }

  @override
  void dispose() {
    _skuController.dispose();
    _qtyController.dispose();
    _binController.dispose();
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
        appBar: AppBar(title: const Text('Kiểm kê (Cycle Count)')),
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
                          Icon(Icons.inventory, color: AppColors.primary, size: 28),
                          SizedBox(width: 8),
                          Text(
                            'Kiểm kê trực tiếp - Kho HCM Mega Hub',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          )
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
                    child: TextField(
                      controller: _binController,
                      decoration: const InputDecoration(
                        labelText: 'Quét / Nhập vị trí Ô Kệ (Bin Code)',
                        prefixIcon: Icon(Icons.location_on),
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _scanBinWithCamera,
                    icon: const Icon(Icons.camera_alt),
                    style: IconButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.all(14),
                    ),
                  )
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _skuController,
                      decoration: const InputDecoration(
                        labelText: 'Quét / Nhập mã Sản phẩm (SKU Code)',
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
              const SizedBox(height: 16),
              TextField(
                controller: _qtyController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Nhập số lượng thực tế đếm được',
                  prefixIcon: Icon(Icons.numbers),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 32),
              ElevatedButton.icon(
                onPressed: _isLoading ? null : _submitCount,
                icon: _isLoading 
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
                  : const Icon(Icons.save),
                label: const Text('LƯU KẾT QUẢ ĐẾM THẬT'),
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
