import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/utils/scanner_helper.dart';
import '../../../../../core/constants/app_colors.dart';
import '../providers/inventory_provider.dart';

class InventorySearchScreen extends ConsumerStatefulWidget {
  const InventorySearchScreen({super.key});

  @override
  ConsumerState<InventorySearchScreen> createState() => _InventorySearchScreenState();
}

class _InventorySearchScreenState extends ConsumerState<InventorySearchScreen> {
  late final ScannerHelper _scannerHelper;
  String _searchedSku = '';
  bool _isLoading = false;
  Map<String, dynamic>? _inventoryData;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _scannerHelper = ScannerHelper(onCodeScanned: _handleScan);
  }

  void _handleScan(String code) async {
    if (_isLoading) return;
    
    setState(() {
      _searchedSku = code;
      _isLoading = true;
      _errorMessage = '';
      _inventoryData = null;
    });

    try {
      final repo = ref.read(inventoryRepositoryProvider);
      final data = await repo.getInventoryBySku(code);
      
      setState(() {
        _inventoryData = data;
        if (data == null) {
          _errorMessage = 'Không tìm thấy tồn kho cho SKU này.';
        }
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
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
              hintText: 'Nhập mã SKU...',
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
    return KeyboardListener(
      focusNode: _scannerHelper.focusNode,
      onKeyEvent: _scannerHelper.handleKeyEvent,
      autofocus: true,
      child: Scaffold(
        appBar: AppBar(title: const Text('Tra Cứu Tồn Kho')),
        body: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.primary),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.qr_code_scanner, size: 48, color: AppColors.primary),
                    const SizedBox(height: 16),
                    Text(
                      _searchedSku.isEmpty ? 'HÃY QUÉT MÃ SẢN PHẨM' : 'ĐANG XEM: $_searchedSku',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              
              if (_isLoading)
                const Center(child: CircularProgressIndicator())
              else if (_errorMessage.isNotEmpty)
                Center(child: Text(_errorMessage, style: const TextStyle(color: AppColors.error, fontSize: 16)))
              else if (_inventoryData != null) ...[
                const Text('Kết quả:', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                Card(
                  child: ListTile(
                    title: Text('Sản phẩm: ${_inventoryData!['sku']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                    subtitle: Text('Có sẵn: ${_inventoryData!['availableQty']} | Đã giữ: ${_inventoryData!['reservedQty']}'),
                    trailing: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: AppColors.success, borderRadius: BorderRadius.circular(8)),
                      child: Text('Tổng: ${_inventoryData!['quantityOnHand']}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                    ),
                  ),
                ),
              ]
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
