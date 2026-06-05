import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/utils/scanner_helper.dart';
import '../../../../core/error/error_handler.dart';
import '../../wms/qr/providers/qr_providers.dart';
import '../../wms/qr/domain/qr_models.dart';

class ScanTabScreen extends ConsumerStatefulWidget {
  const ScanTabScreen({super.key});

  @override
  ConsumerState<ScanTabScreen> createState() => _ScanTabScreenState();
}

class _ScanTabScreenState extends ConsumerState<ScanTabScreen> {
  late final ScannerHelper _scannerHelper;
  final TextEditingController _inputController = TextEditingController();
  final MobileScannerController _cameraController = MobileScannerController();

  bool _isLoading = false;
  String? _lastCode;
  QrParseResult? _parseResult;
  dynamic _detailResult; // Lưu trữ chi tiết tuỳ theo loại QR

  @override
  void initState() {
    super.initState();
    _scannerHelper = ScannerHelper(onCodeScanned: _handleCode);
  }

  @override
  void dispose() {
    _inputController.dispose();
    _cameraController.dispose();
    _scannerHelper.focusNode.dispose();
    super.dispose();
  }

  Future<void> _handleCode(String code) async {
    if (code.isEmpty || _isLoading) return;

    setState(() {
      _isLoading = true;
      _lastCode = code;
      _parseResult = null;
      _detailResult = null;
    });

    try {
      final lookupService = ref.read(qrLookupServiceProvider);
      
      // Step 1: Parse QR code
      final parseResult = await lookupService.parse(rawValue: code);
      setState(() => _parseResult = parseResult);

      // Step 2: Tra cứu chi tiết tuỳ theo QrType
      if (parseResult.entityId != null) {
        final entityId = parseResult.entityId!;
        switch (parseResult.type) {
          case QrType.bin:
            final detail = await lookupService.lookupBin(binId: entityId);
            setState(() => _detailResult = detail);
            break;
          case QrType.sku:
            final detail = await lookupService.lookupSku(skuCode: entityId);
            setState(() => _detailResult = detail);
            break;
          case QrType.order:
          case QrType.outboundOrder:
            final detail = await lookupService.lookupOrder(orderId: entityId);
            setState(() => _detailResult = detail);
            break;
          case QrType.shipment:
            final detail = await lookupService.lookupShipment(shipmentId: entityId);
            setState(() => _detailResult = detail);
            break;
          default:
            break;
        }
      }
    } catch (e) {
      if (mounted) {
        ErrorHandler.showError(context, e);
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _resetScanner() {
    setState(() {
      _lastCode = null;
      _parseResult = null;
      _detailResult = null;
    });
    _inputController.clear();
  }

  @override
  Widget build(BuildContext context) {
    return KeyboardListener(
      focusNode: _scannerHelper.focusNode,
      onKeyEvent: _scannerHelper.handleKeyEvent,
      autofocus: true,
      child: Scaffold(
        body: Column(
          children: [
            // Phần trên: Camera quét mã (nếu chưa có kết quả) hoặc thông tin kết quả quét
            Expanded(
              flex: 4,
              child: _lastCode == null
                  ? Stack(
                      children: [
                        MobileScanner(
                          controller: _cameraController,
                          onDetect: (capture) {
                            final List<Barcode> barcodes = capture.barcodes;
                            if (barcodes.isNotEmpty && barcodes.first.rawValue != null) {
                              final String code = barcodes.first.rawValue!;
                              _handleCode(code);
                            }
                          },
                        ),
                        // Khung lưới căn chỉnh quét mã
                        Center(
                          child: Container(
                            width: 260,
                            height: 260,
                            decoration: BoxDecoration(
                              border: Border.all(color: AppColors.primary, width: 3),
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                        ),
                        const Positioned(
                          bottom: 24,
                          left: 0,
                          right: 0,
                          child: Center(
                            child: Card(
                              color: Colors.black54,
                              child: Padding(
                                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                child: Text(
                                  'Hướng camera vào mã QR/Barcode',
                                  style: TextStyle(color: Colors.white, fontSize: 13),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    )
                  : _buildResultContainer(),
            ),

            // Phần dưới: Nhập mã thủ công & Các nút điều hướng nhanh
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -4),
                  )
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _inputController,
                          decoration: const InputDecoration(
                            labelText: 'Nhập mã thủ công hoặc dùng máy quét ngoài',
                            prefixIcon: Icon(Icons.qr_code),
                            border: OutlineInputBorder(),
                          ),
                          onSubmitted: (value) {
                            if (value.isNotEmpty) {
                              _handleCode(value.trim());
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filled(
                        onPressed: () {
                          if (_inputController.text.isNotEmpty) {
                            _handleCode(_inputController.text.trim());
                          }
                        },
                        icon: const Icon(Icons.arrow_forward),
                        style: IconButton.styleFrom(
                          padding: const EdgeInsets.all(16),
                          backgroundColor: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                  if (_lastCode != null) ...[
                    const SizedBox(height: 12),
                    ElevatedButton.icon(
                      onPressed: _resetScanner,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Quét tiếp mã mới'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResultContainer() {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Đang tra cứu cơ sở dữ liệu kho...'),
          ],
        ),
      );
    }

    if (_parseResult == null) {
      return const Center(
        child: Text('Không tìm thấy thông tin phù hợp cho mã quét này.'),
      );
    }

    final parse = _parseResult!;

    return Container(
      color: Colors.grey.withOpacity(0.05),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Card loại thực thể quét được
            Card(
              color: AppColors.primary.withOpacity(0.08),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: AppColors.primary.withOpacity(0.3)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    const Icon(Icons.verified, color: AppColors.primary, size: 36),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'LOẠI ĐỐI TƯỢNG: ${_getQrTypeDisplay(parse.type)}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                              letterSpacing: 1.1,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            parse.entityId ?? _lastCode ?? '',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Hiển thị chi tiết theo từng loại thực thể
            _buildDetailSection(),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailSection() {
    if (_detailResult == null) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              const Icon(Icons.info_outline, size: 48, color: AppColors.textSecondary),
              const SizedBox(height: 12),
              Text(
                'Mã: $_lastCode\nKhông có chi tiết cụ thể bổ sung từ server.',
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    final type = _parseResult!.type;

    if (type == QrType.bin) {
      // Đối với Bin: Hiển thị thông tin ô kệ và danh sách tồn kho tại ô
      final binData = _detailResult as Map<String, dynamic>;
      final skuItems = binData['items'] as List<dynamic>? ?? [];

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Thông Tin Vị Trí Ô Kệ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  _buildDetailRow('Mã Vị Trí (Bin):', binData['binCode'] as String? ?? 'N/A'),
                  _buildDetailRow('Trạng thái:', binData['status'] as String? ?? 'Hoạt động'),
                  _buildDetailRow('Loại kệ:', binData['zoneName'] as String? ?? binData['zoneType'] as String? ?? 'Mặc định'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text('Danh Sách SKU Đang Lưu Trữ (${skuItems.length})', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          if (skuItems.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(24.0),
                child: Center(child: Text('Vị trí kệ này đang trống', style: TextStyle(color: AppColors.textSecondary))),
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: skuItems.length,
              itemBuilder: (context, index) {
                final item = skuItems[index];
                final skuCode = item['skuCode'] as String? ?? item['sku'] as String? ?? 'SKU N/A';
                final qty = item['quantity'] ?? item['quantityOnHand'] ?? 0;
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: const CircleAvatar(child: Icon(Icons.category)),
                    title: Text(skuCode, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text(item['skuName'] as String? ?? 'Lô: ${item['lotNo'] ?? 'N/A'}'),
                    trailing: Text(
                      'SL: $qty',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary),
                    ),
                  ),
                );
              },
            ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    context.push('/wms/count?binCode=${binData['binCode']}');
                  },
                  icon: const Icon(Icons.fact_check),
                  label: const Text('Kiểm kê ô kệ'),
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
                    context.push('/wms/putaway');
                  },
                  icon: const Icon(Icons.move_to_inbox),
                  label: const Text('Cất hàng vào đây'),
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
    }

    if (type == QrType.sku) {
      // Đối với SKU: Hiển thị thông tin SKU và danh sách ô kệ đang chứa SKU này
      final skuData = _detailResult as Map<String, dynamic>;
      final binLocations = skuData['locations'] as List<dynamic>? ?? skuData['bins'] as List<dynamic>? ?? [];

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Thông Tin Sản Phẩm', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  _buildDetailRow('Mã SKU:', skuData['skuCode'] as String? ?? 'N/A'),
                  _buildDetailRow('Tên sản phẩm:', skuData['name'] as String? ?? 'N/A'),
                  _buildDetailRow('Có sẵn:', '${(skuData['totalQuantity'] ?? skuData['totalOnHand'] ?? 0) - (skuData['totalReserved'] ?? 0)}'),
                  _buildDetailRow('Tổng tồn kho:', '${skuData['totalQuantity'] ?? skuData['totalOnHand'] ?? 0}'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text('Vị Trí Đang Lưu Trữ (${binLocations.length})', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          if (binLocations.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(24.0),
                child: Center(child: Text('Sản phẩm này chưa được xếp vào ô kệ nào', style: TextStyle(color: AppColors.textSecondary))),
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: binLocations.length,
              itemBuilder: (context, index) {
                final loc = binLocations[index];
                final bin = loc['binCode'] as String? ?? 'BIN N/A';
                final qty = loc['quantity'] ?? loc['quantityOnHand'] ?? 0;
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: const CircleAvatar(child: Icon(Icons.move_to_inbox)),
                    title: Text(bin, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('Lô: ${loc['lotNo'] ?? 'N/A'}'),
                    trailing: Text(
                      'SL: $qty',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary),
                    ),
                  ),
                );
              },
            ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    context.push('/wms/layout?sku=${skuData['skuCode']}');
                  },
                  icon: const Icon(Icons.map),
                  label: const Text('Xem trên sơ đồ'),
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
                    context.push('/wms/layout?sku=${skuData['skuCode']}');
                  },
                  icon: const Icon(Icons.lightbulb),
                  label: const Text('Tìm ô cất trống'),
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
    }

    if (type == QrType.order || type == QrType.outboundOrder) {
      // Đối với Đơn hàng (Outbound Order)
      final orderData = _detailResult as Map<String, dynamic>;
      final String orderId = orderData['id'] as String? ?? '';
      
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Thông Tin Đơn Hàng Xuất Kho', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  _buildDetailRow('Mã đơn:', orderData['orderNo'] as String? ?? 'N/A'),
                  _buildDetailRow('Trạng thái:', orderData['status'] as String? ?? 'N/A'),
                  _buildDetailRow('Số SKU:', '${(orderData['lines'] as List<dynamic>?)?.length ?? 0}'),
                  _buildDetailRow('Ngày tạo:', (orderData['createdAt'] as String?)?.substring(0, 10) ?? 'N/A'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    context.push('/wms/pack');
                  },
                  icon: const Icon(Icons.inventory_2),
                  label: const Text('Đóng gói (Pack)'),
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
                    context.push('/wms/pick_execution/$orderId');
                  },
                  icon: const Icon(Icons.play_arrow),
                  label: const Text('Lấy hàng (Pick)'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.success,
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
    }

    if (type == QrType.shipment) {
      // Đối với Lô hàng / Chuyến xe xuất
      final shipmentData = _detailResult as Map<String, dynamic>;
      final shipmentId = shipmentData['id'] as String? ?? '';
      final shipmentNo = shipmentData['shipmentNo'] as String? ?? 'N/A';
      final status = shipmentData['status'] as String? ?? 'N/A';
      final carrier = shipmentData['carrier'] as String? ?? 'N/A';

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Thông Tin Lô Hàng / Chuyến Xe', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  _buildDetailRow('Mã chuyến xe:', shipmentNo),
                  _buildDetailRow('Đơn vị vận chuyển:', carrier),
                  _buildDetailRow('Trạng thái:', status),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: () {
              context.push('/wms/dispatch_execution/$shipmentId');
            },
            icon: const Icon(Icons.local_shipping),
            label: const Text('Bắt đầu xếp xe (Load)'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              minimumSize: const Size(double.infinity, 50),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ],
      );
    }

    if (type == QrType.receipt) {
      // Đối với Đơn nhập kho (Receipt)
      final receiptData = _detailResult as Map<String, dynamic>;
      final receiptNo = receiptData['receiptNo'] as String? ?? 'N/A';
      final status = receiptData['status'] as String? ?? 'N/A';

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Thông Tin Đơn Nhập Kho', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  _buildDetailRow('Mã phiếu nhập:', receiptNo),
                  _buildDetailRow('Trạng thái:', status),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: () {
              context.push('/wms/receive');
            },
            icon: const Icon(Icons.download),
            label: const Text('Bắt đầu nhận hàng'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.success,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              minimumSize: const Size(double.infinity, 50),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ],
      );
    }

    // Các trường hợp mặc định khác
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const Icon(Icons.info, size: 36, color: AppColors.primary),
            const SizedBox(height: 8),
            Text(
              'Dữ liệu thực thể:\n${_detailResult.toString()}',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        ],
      ),
    );
  }

  String _getQrTypeDisplay(QrType type) {
    switch (type) {
      case QrType.bin:
        return 'Ô KỆ (BIN)';
      case QrType.sku:
        return 'SẢN PHẨM (SKU)';
      case QrType.order:
      case QrType.outboundOrder:
        return 'ĐƠN HÀNG XUẤT (ORDER)';
      case QrType.shipment:
        return 'LÔ HÀNG GOM (SHIPMENT)';
      case QrType.receipt:
        return 'ĐƠN NHẬP KHO (RECEIPT)';
      default:
        return 'MÃ KHÔNG XÁC ĐỊNH';
    }
  }
}
