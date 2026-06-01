import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/constants/app_colors.dart';
import '../providers/inventory_provider.dart';

class CycleCountScreen extends ConsumerStatefulWidget {
  const CycleCountScreen({super.key});

  @override
  ConsumerState<CycleCountScreen> createState() => _CycleCountScreenState();
}

class _CycleCountScreenState extends ConsumerState<CycleCountScreen> {
  final TextEditingController _skuController = TextEditingController();
  final TextEditingController _qtyController = TextEditingController();
  final TextEditingController _binController = TextEditingController();
  
  bool _isLoading = false;
  final String _warehouseId = 'a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'; // HCM Mega Hub

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
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Kiểm kê (Cycle Count)')),
      body: Padding(
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
            TextField(
              controller: _binController,
              decoration: const InputDecoration(
                labelText: 'Quét / Nhập vị trí Ô Kệ (Bin Code)',
                prefixIcon: Icon(Icons.location_on),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _skuController,
              decoration: const InputDecoration(
                labelText: 'Quét / Nhập mã Sản phẩm (SKU Code)',
                prefixIcon: Icon(Icons.qr_code_scanner),
                border: OutlineInputBorder(),
              ),
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
            const Spacer(),
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
    );
  }
}
