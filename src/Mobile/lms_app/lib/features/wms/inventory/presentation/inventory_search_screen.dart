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

  String _selectedFilter = 'Tất cả';
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
        final status = _lookupData!['status'] ?? 'N/A';
        final items = _lookupData!['items'] as List<dynamic>? ?? [];
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.primary, AppColors.primary.withRed(100)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  )
                ],
              ),
              child: ListTile(
                title: Text('Vị trí Bin: $binCode', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: Colors.white)),
                subtitle: Text(
                  'Khu vực: $zone | Trạng thái: $status',
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
                leading: const CircleAvatar(
                  backgroundColor: Colors.white24,
                  child: Icon(Icons.location_on, color: Colors.white, size: 24),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Danh sách tồn kho tại ô:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            if (items.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 24.0),
                  child: Text('Không có tồn kho tại ô này.', style: TextStyle(fontStyle: FontStyle.italic, color: AppColors.textSecondary)),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: items.length,
                itemBuilder: (context, index) {
                  final item = items[index];
                  final sku = item['skuCode'] ?? item['sku'] ?? 'N/A';
                  final qty = item['quantityOnHand'] ?? item['quantity'] ?? 0;
                  final available = item['availableQty'] ?? qty;
                  final lotNo = item['lotNo'] ?? 'N/A';

                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    child: ListTile(
                      leading: const CircleAvatar(child: Icon(Icons.category, size: 20)),
                      title: Text(sku, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('Lô: $lotNo'),
                      trailing: Column(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('$qty PCS', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
                          if (available != qty)
                            Text('Sẵn có: $available', style: const TextStyle(fontSize: 10, color: AppColors.textSecondary))
                        ],
                      ),
                    ),
                  );
                },
              ),
            const SizedBox(height: 16),
            // Contextual actions
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      context.push('/wms/count?binCode=$binCode');
                    },
                    icon: const Icon(Icons.fact_check),
                    label: const Text('Kiểm kê nhanh'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      context.push('/wms/layout');
                    },
                    icon: const Icon(Icons.map),
                    label: const Text('Xem sơ đồ kho'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
              ],
            ),
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
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.green.shade600, Colors.green.shade400],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.green.withOpacity(0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  )
                ],
              ),
              child: ListTile(
                title: Text('SKU: $skuCode', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: Colors.white)),
                subtitle: Text(
                  'Sẵn có: ${totalOnHand - totalReserved} | Đã giữ: $totalReserved',
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
                trailing: Text('$totalOnHand PCS', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: Colors.white)),
                leading: const CircleAvatar(
                  backgroundColor: Colors.white24,
                  child: Icon(Icons.inventory_2, color: Colors.white, size: 24),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Vị trí lưu kho:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            if (bins.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 24.0),
                  child: Text('SKU này chưa có tồn kho tại ô kệ nào.', style: TextStyle(fontStyle: FontStyle.italic, color: AppColors.textSecondary)),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: bins.length,
                itemBuilder: (context, index) {
                  final bin = bins[index];
                  final binCode = bin['binCode'] ?? 'N/A';
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    child: ListTile(
                      title: Text('Ô kệ: $binCode', style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('Lô: ${bin['lotNo'] ?? 'N/A'}'),
                      trailing: Text('${bin['quantityOnHand']} PCS', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary)),
                    ),
                  );
                },
              ),
            const SizedBox(height: 16),
            // Contextual actions
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: () {
                  context.push('/wms/layout?sku=$skuCode');
                },
                icon: const Icon(Icons.map, size: 20),
                label: const Text('Định vị trên sơ đồ kho'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green.shade600,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ),
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
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.amber.shade600, Colors.amber.shade400],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.amber.withOpacity(0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  )
                ],
              ),
              child: ListTile(
                title: Text('Đơn xuất: $orderNo', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white)),
                subtitle: Text(
                  'Trạng thái: $status\nĐến: $address',
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
                leading: const CircleAvatar(
                  backgroundColor: Colors.white24,
                  child: Icon(Icons.receipt_long, color: Colors.white, size: 24),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Chi tiết sản phẩm đơn hàng:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: lines.length,
              itemBuilder: (context, index) {
                final line = lines[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  child: ListTile(
                    title: Text(line['sku'] ?? 'N/A', style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('Lấy: ${line['pickedQty']} | Đóng: ${line['packedQty']}'),
                    trailing: Text('Yêu cầu: ${line['requestedQty']} PCS', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
                  ),
                );
              },
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      context.push('/wms/pack');
                    },
                    icon: const Icon(Icons.gif_box_outlined),
                    label: const Text('Đóng gói đơn'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      context.push('/wms/pick');
                    },
                    icon: const Icon(Icons.shopping_basket),
                    label: const Text('Xem Picking Wave'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.amber.shade600,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
              ],
            ),
          ],
        );

      case QrType.shipment:
        final shipmentNo = _lookupData!['shipmentNo'] ?? 'N/A';
        final status = _lookupData!['status'] ?? 'N/A';
        final carrier = _lookupData!['carrier'] ?? 'N/A';
        final orders = _lookupData!['orders'] as List<dynamic>? ?? [];
        final shipmentId = _lookupData!['id'] ?? _lookupData!['shipmentId'] ?? '';
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.orange.shade600, Colors.orange.shade400],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.orange.withOpacity(0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  )
                ],
              ),
              child: ListTile(
                title: Text('Lô hàng: $shipmentNo', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: Colors.white)),
                subtitle: Text(
                  'Trạng thái: $status | Nhà xe: $carrier',
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
                leading: const CircleAvatar(
                  backgroundColor: Colors.white24,
                  child: Icon(Icons.local_shipping, color: Colors.white, size: 24),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text('Danh sách đơn hàng (${orders.length}):', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: orders.length,
              itemBuilder: (context, index) {
                final order = orders[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  child: ListTile(
                    title: Text('Đơn: ${order['orderNo'] ?? 'N/A'}', style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('Trạng thái: ${order['status'] ?? 'N/A'}'),
                    leading: const Icon(Icons.article_outlined),
                  ),
                );
              },
            ),
            const SizedBox(height: 16),
            if (shipmentId.toString().isNotEmpty)
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: () {
                    context.push('/wms/dispatch_execution/$shipmentId');
                  },
                  icon: const Icon(Icons.local_shipping, size: 20),
                  label: const Text('Xếp hàng lên xe (Load)'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange.shade600,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
     @override
  Widget build(BuildContext context) {
    final List<Map<String, dynamic>> filters = [
      {'label': 'Tất cả', 'icon': Icons.all_inclusive, 'hint': 'Nhập mã hoặc quét bất kỳ...'},
      {'label': 'SKU', 'icon': Icons.inventory_2, 'hint': 'Ví dụ: SKU-001, SKU-002...'},
      {'label': 'Ô kệ', 'icon': Icons.grid_3x3, 'hint': 'Ví dụ: WALL-A-03, BIN-A01-01...'},
      {'label': 'Đơn hàng', 'icon': Icons.receipt_long, 'hint': 'Ví dụ: ORD-001...'},
      {'label': 'Lô hàng', 'icon': Icons.local_shipping, 'hint': 'Ví dụ: SHP-001...'},
    ];

    final currentHint = filters.firstWhere(
      (f) => f['label'] == _selectedFilter,
      orElse: () => filters.first,
    )['hint'] as String;

    return KeyboardListener(
      focusNode: _scannerHelper.focusNode,
      onKeyEvent: _scannerHelper.handleKeyEvent,
      autofocus: true,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Tra Cứu Thông Tin (WMS Smart)'),
          actions: [
            if (_lookupData != null || _errorMessage.isNotEmpty)
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: () {
                  setState(() {
                    _searchController.clear();
                    _lookupData = null;
                    _resultType = null;
                    _errorMessage = '';
                  });
                },
                tooltip: 'Làm mới',
              ),
          ],
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Thanh tìm kiếm Premium
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    )
                  ],
                  border: Border.all(color: Colors.grey.shade200, width: 1),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0),
                        child: TextField(
                          controller: _searchController,
                          decoration: InputDecoration(
                            hintText: currentHint,
                            hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                            prefixIcon: const Icon(Icons.qr_code_scanner, color: AppColors.primary),
                            prefixIconConstraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                            suffixIcon: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (_searchController.text.isNotEmpty)
                                  IconButton(
                                    icon: const Icon(Icons.clear, size: 20),
                                    onPressed: () {
                                      _searchController.clear();
                                      setState(() {});
                                    },
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(),
                                  ),
                                const SizedBox(width: 8),
                                IconButton(
                                  icon: const Icon(Icons.camera_alt, color: AppColors.primary, size: 20),
                                  onPressed: _openCameraScanner,
                                  tooltip: 'Quét Camera',
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints(),
                                ),
                              ],
                            ),
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          onSubmitted: (value) {
                            if (value.isNotEmpty) {
                              _handleScan(value.trim());
                            }
                          },
                          onChanged: (val) => setState(() {}),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      height: 48,
                      width: 48,
                      margin: const EdgeInsets.only(right: 6),
                      child: IconButton.filled(
                        onPressed: () {
                          if (_searchController.text.isNotEmpty) {
                            _handleScan(_searchController.text.trim());
                          }
                        },
                        icon: const Icon(Icons.search, size: 20),
                        style: IconButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // 2. Bộ lọc nhanh dạng Chips hướng dẫn
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: filters.map((filter) {
                    final label = filter['label'] as String;
                    final icon = filter['icon'] as IconData;
                    final isSelected = _selectedFilter == label;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: ChoiceChip(
                        avatar: Icon(
                          icon,
                          size: 14,
                          color: isSelected ? Colors.white : AppColors.textSecondary,
                        ),
                        label: Text(
                          label,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: isSelected ? Colors.white : AppColors.textPrimary,
                          ),
                        ),
                        selected: isSelected,
                        onSelected: (selected) {
                          if (selected) {
                            setState(() {
                              _selectedFilter = label;
                            });
                          }
                        },
                        selectedColor: AppColors.primary,
                        backgroundColor: Colors.grey.shade100,
                        checkmarkColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 20),

              // 3. Phần hiển thị kết quả
              if (_isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 40.0),
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (_errorMessage.isNotEmpty)
                Center(
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    padding: const EdgeInsets.all(20),
                    margin: const EdgeInsets.only(top: 10),
                    decoration: BoxDecoration(
                      color: AppColors.error.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.error.withOpacity(0.2), width: 1.5),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.error_outline, color: AppColors.error, size: 40),
                        const SizedBox(height: 12),
                        Text(
                          _errorMessage,
                          style: const TextStyle(color: AppColors.error, fontSize: 14, fontWeight: FontWeight.w500),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                )
              else if (_lookupData != null)
                Column(
                  children: [
                    _buildResultView(),
                    Padding(
                      padding: const EdgeInsets.only(top: 24.0, bottom: 16.0),
                      child: TextButton.icon(
                        onPressed: () {
                          setState(() {
                            _searchController.clear();
                            _lookupData = null;
                            _resultType = null;
                            _errorMessage = '';
                          });
                        },
                        icon: const Icon(Icons.refresh, color: AppColors.textSecondary, size: 18),
                        label: const Text('Xóa kết quả tra cứu', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                      ),
                    ),
                  ],
                )
              else
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 60),
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.06),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.qr_code_scanner_outlined,
                          size: 72,
                          color: AppColors.primary.withOpacity(0.8),
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'WMS Smart Lookup',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 8),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 24.0),
                        child: Text(
                          'Sử dụng đầu quét phần cứng của thiết bị PDA hoặc bấm Camera để quét mã vạch SKU, Ô kệ, Đơn hàng hoặc Lô hàng để tra cứu thông tin nhanh chóng.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.5),
                        ),
                      ),
                      const SizedBox(height: 40),
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
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: const Icon(Icons.camera_alt),
            ),
            const SizedBox(height: 16),
            FloatingActionButton(
              heroTag: 'keyboard',
              onPressed: _showManualInputDialog,
              tooltip: 'Nhập mã thủ công',
              backgroundColor: Colors.white,
              foregroundColor: AppColors.primary,
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: const Icon(Icons.keyboard_outlined),
            ),
          ],
        ),
      ),
    );
  }
}
