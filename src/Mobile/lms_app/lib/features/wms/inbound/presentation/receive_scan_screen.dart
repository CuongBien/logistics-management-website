import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../../core/utils/scanner_helper.dart';
import '../../../../../core/constants/app_colors.dart';
import '../providers/inbound_provider.dart';
import '../../../../../core/widgets/camera_scanner_dialog.dart';

class ReceiveScanScreen extends ConsumerStatefulWidget {
  const ReceiveScanScreen({super.key});

  @override
  ConsumerState<ReceiveScanScreen> createState() => _ReceiveScanScreenState();
}

class _ReceiveScanScreenState extends ConsumerState<ReceiveScanScreen> {
  late final ScannerHelper _scannerHelper;
  final TextEditingController _orderIdController = TextEditingController();

  String _orderId = '';
  String _receiptId = '';
  String _receiptNo = '';
  String _status = '';
  List<dynamic> _receiptLines = [];
  bool _isLoading = false;
  String _lastScanned = 'Chưa quét SKU nào';

  Map<String, dynamic>? _lastReceiveResult;

  @override
  void initState() {
    super.initState();
    _scannerHelper = ScannerHelper(onCodeScanned: _handleScan);
  }

  Future<void> _loadReceipt(String orderId) async {
    if (orderId.isEmpty) return;
    setState(() {
      _isLoading = true;
      _lastReceiveResult = null;
    });

    try {
      final repo = ref.read(inboundRepositoryProvider);
      final receipt = await repo.getReceiptByOrderId(orderId);
      
      setState(() {
        _orderId = orderId;
        _receiptId = receipt['id']?.toString() ?? '';
        _receiptNo = receipt['receiptNo']?.toString() ?? 'N/A';
        _status = receipt['status']?.toString() ?? 'Pending';
        _receiptLines = receipt['lines'] as List<dynamic>? ?? [];
        _isLoading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('✅ Đã tải phiếu nhập: $_receiptNo'),
        backgroundColor: AppColors.success,
      ));
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('❌ Lỗi tải phiếu nhập: ${e.toString().replaceAll('Exception: ', '')}'),
        backgroundColor: AppColors.error,
      ));
    }
  }

  void _handleScan(String code) async {
    if (_orderId.isEmpty || _receiptId.isEmpty) {
      // Nếu chưa có Order ID, thử load Order ID từ mã quét được
      if (code.length >= 36) {
        _orderIdController.text = code;
        _loadReceipt(code);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('⚠️ Vui lòng quét hoặc nhập mã Order ID trước!'),
          backgroundColor: AppColors.warning,
        ));
      }
      return;
    }

    // Nếu đã có Order ID, quét mã SKU để nhận hàng
    setState(() {
      _lastScanned = code;
      _isLoading = true;
    });

    try {
      final repo = ref.read(inboundRepositoryProvider);
      // Gọi API nhận hàng thực tế
      final result = await repo.receiveItem(
        receiptId: _receiptId,
        orderId: _orderId,
        skuCode: code,
        binCode: 'BIN-DOCK-01', // HCM pre-dock location
        quantity: 1,
      );

      setState(() {
        _lastReceiveResult = result;
      });

      // Tải lại phiếu nhập để cập nhật số lượng động
      await _loadReceipt(_orderId);

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('✅ Nhận thành công SKU: $code (Pre-dock: BIN-DOCK-01)'),
        backgroundColor: AppColors.success,
      ));
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('❌ Lỗi nhận hàng: ${e.toString().replaceAll('Exception: ', '')}'),
        backgroundColor: AppColors.error,
      ));
    }
  }

  void _forceClose() async {
    if (_receiptId.isEmpty) return;
    setState(() => _isLoading = true);

    try {
      final repo = ref.read(inboundRepositoryProvider);
      await repo.forceCloseReceipt(_receiptId);
      await _loadReceipt(_orderId);

      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('✅ Đã đóng cưỡng chế phiếu nhập thành công!'),
        backgroundColor: AppColors.success,
      ));
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('❌ Lỗi: ${e.toString().replaceAll('Exception: ', '')}'),
        backgroundColor: AppColors.error,
      ));
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
          title: const Text('Nhập mã thủ công'),
          content: TextField(
            controller: controller,
            decoration: const InputDecoration(
              hintText: 'Nhập mã Order ID / SKU...',
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
    _orderIdController.dispose();
    _scannerHelper.focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    Color statusColor = Colors.orange;
    if (_status == '1' || _status.toLowerCase() == 'received' || _status.toLowerCase() == 'completed') {
      statusColor = AppColors.success;
    } else if (_status.toLowerCase() == 'closed' || _status == '2') {
      statusColor = Colors.grey;
    }

    return KeyboardListener(
      focusNode: _scannerHelper.focusNode,
      onKeyEvent: _scannerHelper.handleKeyEvent,
      autofocus: true,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Nhận Hàng (Inbound)'),
          actions: [
            if (_receiptId.isNotEmpty && _status != 'Closed' && _status != '2')
              IconButton(
                icon: const Icon(Icons.disabled_by_default, color: Colors.redAccent),
                tooltip: 'Đóng cưỡng chế (OS&D)',
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: const Text('Đóng cưỡng chế phiếu?'),
                      content: const Text('Bạn có chắc chắn muốn đóng cưỡng chế phiếu nhập này không? (Áp dụng khi NCC giao thiếu hàng).'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Hủy')),
                        ElevatedButton(
                          onPressed: () {
                            Navigator.pop(context);
                            _forceClose();
                          },
                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
                          child: const Text('Đồng ý đóng'),
                        )
                      ],
                    ),
                  );
                },
              )
          ],
        ),
        body: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Khu vực tải Order
              Card(
                elevation: 4,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _orderIdController,
                              decoration: const InputDecoration(
                                labelText: 'Quét / Nhập Inbound Order ID',
                                prefixIcon: Icon(Icons.inventory),
                                border: OutlineInputBorder(),
                              ),
                              onSubmitted: (value) {
                                if (value.isNotEmpty) _loadReceipt(value.trim());
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: () {
                              _loadReceipt(_orderIdController.text.trim());
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
                      if (_receiptNo.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Số phiếu: $_receiptNo',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: statusColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: statusColor),
                              ),
                              child: Text(
                                _status == '1' ? 'Hoàn thành' : (_status == '0' ? 'Đang chờ' : _status),
                                style: TextStyle(color: statusColor, fontWeight: FontWeight.bold),
                              ),
                            )
                          ],
                        ),
                      ]
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Gợi ý cất kệ (Putaway) nếu có
              if (_lastReceiveResult != null && _lastReceiveResult!['isPutawaySuggested'] == true) ...[
                Card(
                  color: AppColors.success.withOpacity(0.15),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: AppColors.success, width: 2),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.move_to_inbox, color: AppColors.success, size: 28),
                            SizedBox(width: 8),
                            Text(
                              'GỢI Ý CẤT HÀNG (PUTAWAY)',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.success),
                            )
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Hãy mang SKU này cất vào ô kệ: ${_lastReceiveResult!['suggestedPutawayBinCode'] ?? 'UNKNOWN'}',
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 12),
                        ElevatedButton.icon(
                          onPressed: () {
                            final taskId = _lastReceiveResult!['putawayTaskId'] ?? '';
                            final binCode = _lastReceiveResult!['suggestedPutawayBinCode'] ?? 'UNKNOWN';
                            GoRouter.of(context).push('/wms/putaway?taskId=$taskId&targetBin=$binCode');
                          },
                          icon: const Icon(Icons.arrow_forward),
                          label: const Text('TIẾN HÀNH CẤT HÀNG NGAY'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.success,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                          ),
                        )
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Danh sách sản phẩm
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _receiptLines.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: const [
                                Icon(Icons.qr_code_scanner, size: 64, color: AppColors.textSecondary),
                                SizedBox(height: 8),
                                Text(
                                  'Chưa có dữ liệu phiếu nhập.\nVui lòng quét mã Order ID để tải.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: AppColors.textSecondary),
                                )
                              ],
                            ),
                          )
                        : Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 4.0, vertical: 8.0),
                                child: Text(
                                  'Chi tiết sản phẩm nhận:',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                              ),
                              Expanded(
                                child: ListView.builder(
                                  itemCount: _receiptLines.length,
                                  itemBuilder: (context, index) {
                                    final line = _receiptLines[index];
                                    final expected = line['expectedQuantity'] ?? line['expectedQty'] ?? 0;
                                    final received = line['receivedQuantity'] ?? line['receivedQty'] ?? 0;
                                    final sku = line['skuCode'] ?? line['sku'] ?? 'N/A';
                                    final progress = expected > 0 ? received / expected : 0.0;

                                    return Card(
                                      margin: const EdgeInsets.only(bottom: 12),
                                      child: Padding(
                                        padding: const EdgeInsets.all(12.0),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Text(
                                                  sku,
                                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                                                ),
                                                Text(
                                                  '$received / $expected PCS',
                                                  style: TextStyle(
                                                    fontWeight: FontWeight.bold,
                                                    color: received == expected ? AppColors.success : AppColors.primary,
                                                  ),
                                                )
                                              ],
                                            ),
                                            const SizedBox(height: 8),
                                            LinearProgressIndicator(
                                              value: progress,
                                              backgroundColor: Colors.grey.shade200,
                                              color: received == expected ? AppColors.success : AppColors.primary,
                                              minHeight: 8,
                                            ),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ],
                          ),
              ),

              // Bàn quét mã SKU
              if (_receiptId.isNotEmpty && _status != 'Closed' && _status != '2') ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.center_focus_strong, color: AppColors.primary, size: 28),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Đang đợi quét SKU nhận hàng...', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                            Text('Quét cuối: $_lastScanned', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.camera_alt, color: AppColors.primary),
                        onPressed: _openCameraScanner,
                      ),
                      IconButton(
                        icon: const Icon(Icons.keyboard, color: AppColors.primary),
                        onPressed: _showManualInputDialog,
                      )
                    ],
                  ),
                )
              ]
            ],
          ),
        ),
      ),
    );
  }
}
