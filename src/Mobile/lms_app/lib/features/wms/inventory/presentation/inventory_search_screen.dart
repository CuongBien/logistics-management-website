import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/utils/scanner_helper.dart';
import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/widgets/camera_scanner_dialog.dart';
import '../../qr/providers/qr_providers.dart';
import '../../qr/domain/qr_models.dart';
import '../../../../../core/error/app_exception.dart';

class InventorySearchScreen extends ConsumerStatefulWidget {
  const InventorySearchScreen({super.key});

  @override
  ConsumerState<InventorySearchScreen> createState() => _InventorySearchScreenState();
}

class _InventorySearchScreenState extends ConsumerState<InventorySearchScreen> {
  late final ScannerHelper _scannerHelper;
  final TextEditingController _searchController = TextEditingController();

  String _searchedValue = '';
  QrType? _resultType;
  Map<String, dynamic>? _lookupData;
  bool _isLoading = false;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _scannerHelper = ScannerHelper(onCodeScanned: _handleScan);
  }

  void _handleScan(String code) async {
    if (_isLoading || code.isEmpty) return;
    
    setState(() {
      _searchedValue = code;
      _isLoading = true;
      _errorMessage = '';
      _resultType = null;
      _lookupData = null;
    });

    try {
      final lookupService = ref.read(qrLookupServiceProvider);
      
      // Step 1: Parse the QR code smart lookup
      final parseResult = await lookupService.parse(rawValue: code);
      _resultType = parseResult.type;

      if (_resultType == QrType.unknown) {
        throw const AppException('Không nhận diện được định dạng QR Code này.');
      }

      final entityId = parseResult.entityId ?? code;

      // Step 2: Fetch details based on type
      Map<String, dynamic> data = {};
      switch (_resultType) {
        case QrType.bin:
          data = await lookupService.lookupBin(binId: entityId);
          break;
        case QrType.sku:
          final skuCode = parseResult.data?['skuCode'] as String? ?? code;
          data = await lookupService.lookupSku(skuCode: skuCode);
          break;
        case QrType.order:
        case QrType.outboundOrder:
          data = await lookupService.lookupOrder(orderId: entityId);
          break;
        case QrType.shipment:
          data = await lookupService.lookupShipment(shipmentId: entityId);
          break;
        default:
          throw const AppException('Loại đối tượng không hỗ trợ tra cứu.');
      }

      setState(() {
        _lookupData = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e is QrException ? e.friendlyMessage : e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
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
          title: const Text('Tra cứu thủ công'),
          content: TextField(
            controller: controller,
            decoration: const InputDecoration(
              hintText: 'Nhập SKU, BinCode, OrderID...',
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
    _searchController.dispose();
    _scannerHelper.focusNode.dispose();
    super.dispose();
  }

  Widget _buildResultView() {
    if (_lookupData == null || _resultType == null) return const SizedBox();

    switch (_resultType!) {
      case QrType.bin:
        final binCode = _lookupData!['binCode'] ?? 'N/A';
        final zone = _lookupData!['zoneType'] ?? 'N/A';
        final items = _lookupData!['items'] as List<dynamic>? ?? [];
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              color: AppColors.primary.withOpacity(0.1),
              child: ListTile(
                title: Text('Vị trí Bin: $binCode', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                subtitle: Text('Khu vực: $zone | Trạng thái: ${_lookupData!['status'] ?? 'N/A'}'),
                leading: const Icon(Icons.location_on, color: AppColors.primary, size: 36),
              ),
            ),
            const SizedBox(height: 12),
            const Text('Danh sách tồn kho tại ô:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            if (items.isEmpty)
              const Center(child: Text('Không có tồn kho tại ô này.', style: TextStyle(fontStyle: FontStyle.italic)))
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: items.length,
                itemBuilder: (context, index) {
                  final item = items[index];
                  return Card(
                    child: ListTile(
                      title: Text(item['sku'] ?? 'N/A', style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('Lô: ${item['lotNo'] ?? 'N/A'}'),
                      trailing: Text('${item['availableQty']} / ${item['quantityOnHand']} PCS', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ),
                  );
                },
              )
          ],
        );

      case QrType.sku:
        final skuCode = _lookupData!['skuCode'] ?? 'N/A';
        final totalOnHand = _lookupData!['totalOnHand'] ?? 0;
        final totalReserved = _lookupData!['totalReserved'] ?? 0;
        final bins = _lookupData!['bins'] as List<dynamic>? ?? [];
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              color: AppColors.success.withOpacity(0.1),
              child: ListTile(
                title: Text('SKU: $skuCode', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                subtitle: Text('Có sẵn: ${totalOnHand - totalReserved} | Đã giữ: $totalReserved'),
                trailing: Text('Tổng: $totalOnHand', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: AppColors.success)),
                leading: const Icon(Icons.inventory_2, color: AppColors.success, size: 36),
              ),
            ),
            const SizedBox(height: 12),
            const Text('Vị trí lưu kho:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            if (bins.isEmpty)
              const Center(child: Text('SKU này chưa có tồn kho tại ô kệ nào.', style: TextStyle(fontStyle: FontStyle.italic)))
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: bins.length,
                itemBuilder: (context, index) {
                  final bin = bins[index];
                  return Card(
                    child: ListTile(
                      title: Text('Ô kệ: ${bin['binCode'] ?? 'N/A'}', style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('Lô: ${bin['lotNo'] ?? 'N/A'}'),
                      trailing: Text('${bin['quantityOnHand']} PCS', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ),
                  );
                },
              )
          ],
        );

      case QrType.order:
      case QrType.outboundOrder:
        final orderNo = _lookupData!['orderNo'] ?? 'N/A';
        final status = _lookupData!['status'] ?? 'N/A';
        final address = _lookupData!['destinationAddress'] ?? 'N/A';
        final lines = _lookupData!['lines'] as List<dynamic>? ?? [];
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              color: AppColors.warning.withOpacity(0.1),
              child: ListTile(
                title: Text('Đơn xuất: $orderNo', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                subtitle: Text('Trạng thái: $status\nĐến: $address'),
                leading: const Icon(Icons.receipt_long, color: AppColors.warning, size: 36),
              ),
            ),
            const SizedBox(height: 12),
            const Text('Chi tiết sản phẩm đơn hàng:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: lines.length,
              itemBuilder: (context, index) {
                final line = lines[index];
                return Card(
                  child: ListTile(
                    title: Text(line['sku'] ?? 'N/A', style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('Lấy: ${line['pickedQty']} | Đóng: ${line['packedQty']}'),
                    trailing: Text('Yêu cầu: ${line['requestedQty']} PCS', style: const TextStyle(fontWeight: FontWeight.bold)),
                  ),
                );
              },
            )
          ],
        );

      case QrType.shipment:
        final shipmentNo = _lookupData!['shipmentNo'] ?? 'N/A';
        final status = _lookupData!['status'] ?? 'N/A';
        final carrier = _lookupData!['carrier'] ?? 'N/A';
        final orders = _lookupData!['orders'] as List<dynamic>? ?? [];
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              color: Colors.orange.withOpacity(0.1),
              child: ListTile(
                title: Text('Lô hàng: $shipmentNo', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                subtitle: Text('Trạng thái: $status | Nhà xe: $carrier'),
                leading: const Icon(Icons.local_shipping, color: Colors.orange, size: 36),
              ),
            ),
            const SizedBox(height: 12),
            Text('Danh sách đơn hàng (${orders.length}):', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: orders.length,
              itemBuilder: (context, index) {
                final order = orders[index];
                return Card(
                  child: ListTile(
                    title: Text('Đơn: ${order['orderNo'] ?? 'N/A'}', style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('Trạng thái: ${order['status'] ?? 'N/A'}'),
                    leading: const Icon(Icons.article_outlined),
                  ),
                );
              },
            )
          ],
        );

      default:
        return const Center(child: Text('Loại kết quả không hỗ trợ hiển thị.'));
    }
  }

  @override
  Widget build(BuildContext context) {
    return KeyboardListener(
      focusNode: _scannerHelper.focusNode,
      onKeyEvent: _scannerHelper.handleKeyEvent,
      autofocus: true,
      child: Scaffold(
        appBar: AppBar(title: const Text('Tra Cứu Thông Tin (WMS Smart)')),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                elevation: 4,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          decoration: const InputDecoration(
                            labelText: 'Quét hoặc nhập mã cần tra cứu',
                            prefixIcon: Icon(Icons.qr_code_scanner),
                            border: OutlineInputBorder(),
                          ),
                          onSubmitted: (value) {
                            if (value.isNotEmpty) {
                              _handleScan(value.trim());
                              _searchController.clear();
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: () {
                          if (_searchController.text.isNotEmpty) {
                            _handleScan(_searchController.text.trim());
                            _searchController.clear();
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                        ),
                        child: const Icon(Icons.search),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: _openCameraScanner,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                        ),
                        child: const Icon(Icons.camera_alt),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              if (_isLoading)
                const Center(child: CircularProgressIndicator())
              else if (_errorMessage.isNotEmpty)
                Center(
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.error.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(_errorMessage, style: const TextStyle(color: AppColors.error, fontSize: 16), textAlign: TextAlign.center),
                  ),
                )
              else if (_lookupData != null)
                _buildResultView()
              else
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      SizedBox(height: 48),
                      Icon(Icons.search_sharp, size: 80, color: AppColors.textSecondary),
                      SizedBox(height: 12),
                      Text(
                        'WMS Smart Lookup\nHãy quét mã bất kỳ để xem chi tiết thông tin.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 15),
                      )
                    ],
                  ),
                )
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
