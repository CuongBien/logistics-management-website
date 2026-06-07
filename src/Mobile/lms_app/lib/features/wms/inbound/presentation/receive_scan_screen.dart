import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../../core/utils/scanner_helper.dart';
import '../../../../../core/constants/app_colors.dart';
import '../providers/inbound_provider.dart';
import '../../../../../core/widgets/camera_scanner_dialog.dart';
import '../../qr/providers/qr_providers.dart';
import '../../qr/domain/qr_models.dart';
import '../../../../../core/network/offline_queue.dart';
import '../../../../../core/network/connectivity_service.dart';
import '../../../../../core/error/app_exception.dart';
import '../../../../../core/error/error_handler.dart';
import '../../../../../core/constants/app_config.dart';

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

  ScanReceiveResponse? _lastReceiveResult;

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
      String targetId = orderId;
      try {
        final parsed = await ref.read(qrLookupServiceProvider).parse(rawValue: orderId);
        if (parsed.type == QrType.order || parsed.type == QrType.receipt || parsed.type == QrType.outboundOrder) {
          targetId = parsed.entityId ?? parsed.data?['waybillCode'] ?? orderId;
        }
      } catch (_) {
        // Ignored
      }

      final activeWarehouse = ref.read(warehouseContextProvider);
      if (activeWarehouse == null || activeWarehouse.warehouseId.isEmpty) {
        throw AppException(
          'Vui lòng chọn kho làm việc trước khi quét nhận hàng!',
          code: 'Warehouse.Required',
        );
      }

      final repo = ref.read(inboundRepositoryProvider);
      final receipt = await repo.getReceiptByOrderId(targetId, warehouseId: activeWarehouse.warehouseId);

      // Chặn nếu phiếu nhập thuộc kho khác
      final receiptWarehouseId = receipt['warehouseId']?.toString() ?? receipt['warehouse_id']?.toString() ?? '';
      
      if (activeWarehouse != null && activeWarehouse.warehouseId.isNotEmpty &&
          receiptWarehouseId.isNotEmpty && receiptWarehouseId != activeWarehouse.warehouseId) {
        throw AppException(
          'Phiếu nhập này thuộc kho khác (${receipt['warehouseName'] ?? receiptWarehouseId}).\nBạn đang ở kho: ${activeWarehouse.warehouseName}. Vui lòng chuyển đúng kho làm việc.',
          code: 'Warehouse.Mismatch',
        );
      }
      
      setState(() {
        _orderId = targetId;
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
      if (mounted) {
        ErrorHandler.showError(context, e);
      }
    }
  }

  void _handleScan(String code) async {
    if (_orderId.isEmpty || _receiptId.isEmpty) {
      _orderIdController.text = code;
      _loadReceipt(code);
      return;
    }

    String cleanSku = code;
    if (code.startsWith('SKU:')) {
      cleanSku = code.substring(4);
    }
    
    // Scan continuous mode: default +1
    _executeReceiveAction(
      sku: cleanSku,
      quantity: 1,
    );
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
      if (mounted) {
        ErrorHandler.showError(context, e);
      }
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

  void _showManualEntryDialog(Map<String, dynamic> line) {
    final sku = line['skuCode'] ?? line['sku'] ?? '';
    final expected = line['expectedQuantity'] ?? line['expectedQty'] ?? 0;
    final received = line['receivedQuantity'] ?? line['receivedQty'] ?? 0;
    final remaining = expected - received > 0 ? expected - received : 1;

    final TextEditingController qtyController = TextEditingController(text: remaining.toString());
    final TextEditingController lotController = TextEditingController();
    DateTime? selectedDate;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              title: Text('Nhập $sku thủ công'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: qtyController,
                      decoration: const InputDecoration(labelText: 'Số lượng', border: OutlineInputBorder()),
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: lotController,
                      decoration: const InputDecoration(labelText: 'Số Lô / Batch No (Tuỳ chọn)', border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 12),
                    InkWell(
                      onTap: () async {
                        final date = await showDatePicker(
                          context: context,
                          initialDate: DateTime.now().add(const Duration(days: 30)),
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(const Duration(days: 3650)),
                        );
                        if (date != null) {
                          setStateDialog(() => selectedDate = date);
                        }
                      },
                      child: InputDecorator(
                        decoration: const InputDecoration(labelText: 'Hạn sử dụng (Tuỳ chọn)', border: OutlineInputBorder()),
                        child: Text(selectedDate == null ? 'Chọn ngày' : '${selectedDate!.day}/${selectedDate!.month}/${selectedDate!.year}'),
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context), child: const Text('Hủy')),
                ElevatedButton(
                  onPressed: () {
                    final qty = int.tryParse(qtyController.text) ?? 1;
                    Navigator.pop(context);
                    _executeReceiveAction(
                      sku: sku,
                      quantity: qty,
                      lotNo: lotController.text.isNotEmpty ? lotController.text : null,
                      expiryDate: selectedDate,
                    );
                  },
                  child: const Text('Xác nhận'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _executeReceiveAction({
    required String sku,
    required int quantity,
    String? lotNo,
    DateTime? expiryDate,
  }) async {
    setState(() {
      _lastScanned = sku;
      _isLoading = true;
    });

    final isOffline = ref.read(isOnlineProvider).value == false;

    if (isOffline) {
      final actionId = DateTime.now().microsecondsSinceEpoch.toString();
      final body = {
        'receiptId': _receiptId,
        'scannedSku': sku,
        'scannedBin': 'BIN-DOCK-01',
        'quantity': quantity,
        if (lotNo != null) 'lotNo': lotNo,
        if (expiryDate != null) 'expiryDate': expiryDate.toIso8601String(),
      };

      try {
        final queue = ref.read(offlineQueueProvider);
        await queue.enqueue(OfflineAction(
          id: actionId,
          actionType: 'scan-receive',
          endpoint: '/qrcode/actions/scan-receive',
          method: 'POST',
          body: body,
          createdAt: DateTime.now(),
        ));
        
        ref.read(pendingCountProvider.notifier).set(queue.pendingCount);

        setState(() {
          _isLoading = false;
          final lines = List<Map<String, dynamic>>.from(
            _receiptLines.map((e) => Map<String, dynamic>.from(e as Map))
          );
          for (var line in lines) {
            final lineSku = line['skuCode'] ?? line['sku'] ?? '';
            if (lineSku == sku) {
              final currentReceived = line['receivedQuantity'] ?? line['receivedQty'] ?? 0;
              line['receivedQuantity'] = currentReceived + quantity;
            }
          }
          _receiptLines = lines;
        });

        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('📥 Đã lưu yêu cầu ngoại tuyến (sẽ đồng bộ khi có mạng)'),
          backgroundColor: AppColors.warning,
        ));
      } catch (e) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('❌ Lỗi lưu ngoại tuyến: $e'),
          backgroundColor: AppColors.error,
        ));
      }
      return;
    }

    try {
      final qrActionService = ref.read(qrActionServiceProvider);
      final result = await qrActionService.scanReceive(
        receiptId: _receiptId,
        scannedSku: sku,
        scannedBin: 'BIN-DOCK-01',
        quantity: quantity,
        lotNo: lotNo,
        expiryDate: expiryDate,
      );

      setState(() {
        _lastReceiveResult = result;
      });

      await _loadReceipt(_orderId);

      if (result.alerts != null && (result.alerts!.isOverage || result.alerts!.isUnknownSku)) {
        final alert = result.alerts!;
        String alertMsg = '';
        if (alert.isOverage) alertMsg += '• Nhận thừa số lượng yêu cầu.\n';
        if (alert.isUnknownSku) alertMsg += '• SKU không tồn tại trong hệ thống.\n';
        if (alert.quarantineBin != null) alertMsg += '⚠️ Đề xuất chuyển vào ô cách ly: ${alert.quarantineBin}';
        
        if (mounted) {
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: const Row(
                children: [
                  Icon(Icons.warning, color: Colors.orange),
                  SizedBox(width: 8),
                  Text('Cảnh Báo Nhận Hàng'),
                ],
              ),
              content: Text(alertMsg),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Đã hiểu'),
                ),
              ],
            ),
          );
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('✅ Nhận thành công SKU: $sku (Pre-dock: BIN-DOCK-01)'),
          backgroundColor: AppColors.success,
        ));
      }

      // Xử lý đề xuất cất hàng Putaway / Crossdock
      if (result.suggestion != null && mounted) {
        final sugg = result.suggestion!;
        if (sugg.type == 'PUTAWAY') {
          final confirm = await showDialog<bool>(
            context: context,
            builder: (context) => AlertDialog(
              title: const Row(
                children: [
                  Icon(Icons.inventory, color: AppColors.primary),
                  SizedBox(width: 8),
                  Text('Đề xuất Cất Hàng (Putaway)'),
                ],
              ),
              content: Text('Hệ thống đề xuất cất sản phẩm này vào ô kệ:\n\n👉 ${sugg.suggestedBinCode}\n\nBạn có muốn thực hiện cất hàng ngay bây giờ không?'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('Làm sau (Hàng đợi)'),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
                  child: const Text('Cất hàng ngay'),
                ),
              ],
            ),
          );

          if (confirm == true && mounted) {
            context.push(
              Uri(
                path: '/wms/putaway_execution',
                queryParameters: {
                  'taskId': sugg.taskId ?? '',
                  'targetBin': sugg.suggestedBinCode ?? '',
                },
              ).toString(),
            );
          }
        } else if (sugg.type == 'CROSSDOCK') {
          final confirm = await showDialog<bool>(
            context: context,
            builder: (context) => AlertDialog(
              title: const Row(
                children: [
                  Icon(Icons.warning, color: Colors.orange),
                  SizedBox(width: 8),
                  Text('Đề xuất Cross-Docking!'),
                ],
              ),
              content: Text('Sản phẩm này cần được đưa ra cửa xuất bến ngay lập tức để chuyển đi:\n\n👉 ${sugg.suggestedBinCode}\n\nThực hiện Cross-Dock ngay chứ?'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('Hủy'),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
                  child: const Text('Thực hiện ngay'),
                ),
              ],
            ),
          );

          if (confirm == true && mounted) {
            context.push(
              Uri(
                path: '/wms/crossdock',
                queryParameters: {
                  'taskId': sugg.taskId ?? '',
                  'targetBin': sugg.suggestedBinCode ?? '',
                },
              ).toString(),
            );
          }
        }
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ErrorHandler.showError(context, e);
      }
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

              // Gợi ý cất kệ (Putaway) hoặc Cross-Dock nếu có
              if (_lastReceiveResult != null && _lastReceiveResult!.suggestion != null) ...[
                Card(
                  color: _lastReceiveResult!.suggestion!.type == 'CROSSDOCK'
                      ? Colors.orange.withOpacity(0.15)
                      : AppColors.success.withOpacity(0.15),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(
                      color: _lastReceiveResult!.suggestion!.type == 'CROSSDOCK'
                          ? Colors.orange
                          : AppColors.success,
                      width: 2,
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              _lastReceiveResult!.suggestion!.type == 'CROSSDOCK'
                                  ? Icons.shuffle
                                  : Icons.move_to_inbox,
                              color: _lastReceiveResult!.suggestion!.type == 'CROSSDOCK'
                                  ? Colors.orange
                                  : AppColors.success,
                              size: 28,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              _lastReceiveResult!.suggestion!.type == 'CROSSDOCK'
                                  ? 'GỢI Ý CHUYỂN THẲNG (CROSS-DOCK)'
                                  : 'GỢI Ý CẤT HÀNG (PUTAWAY)',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                                color: _lastReceiveResult!.suggestion!.type == 'CROSSDOCK'
                                    ? Colors.orange
                                    : AppColors.success,
                              ),
                            )
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _lastReceiveResult!.suggestion!.type == 'CROSSDOCK'
                              ? 'Đơn hàng này đủ điều kiện Cross-Dock. Hãy mang đến ô kệ OUT: ${_lastReceiveResult!.suggestion!.suggestedBinCode ?? 'UNKNOWN'}'
                              : 'Hãy mang SKU này cất vào ô kệ: ${_lastReceiveResult!.suggestion!.suggestedBinCode ?? 'UNKNOWN'}',
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 12),
                        ElevatedButton.icon(
                          onPressed: () {
                            final taskId = _lastReceiveResult!.suggestion!.taskId ?? '';
                            final binCode = _lastReceiveResult!.suggestion!.suggestedBinCode ?? 'UNKNOWN';
                            if (_lastReceiveResult!.suggestion!.type == 'CROSSDOCK') {
                              GoRouter.of(context).push('/wms/crossdock?taskId=$taskId&targetBin=$binCode');
                            } else {
                              GoRouter.of(context).push('/wms/putaway?taskId=$taskId&targetBin=$binCode');
                            }
                          },
                          icon: const Icon(Icons.arrow_forward),
                          label: Text(_lastReceiveResult!.suggestion!.type == 'CROSSDOCK'
                              ? 'TIẾN HÀNH CROSS-DOCK NGAY'
                              : 'TIẾN HÀNH CẤT HÀNG NGAY'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _lastReceiveResult!.suggestion!.type == 'CROSSDOCK'
                                ? Colors.orange
                                : AppColors.success,
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

              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _receiptLines.isEmpty
                        ? const Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
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
                                                Expanded(
                                                  child: Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      Text(
                                                        sku,
                                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                                                      ),
                                                      if (line['productName'] != null) ...[
                                                        const SizedBox(height: 4),
                                                        Text(
                                                          line['productName'],
                                                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
                                                          maxLines: 2,
                                                          overflow: TextOverflow.ellipsis,
                                                        ),
                                                      ]
                                                    ],
                                                  ),
                                                ),
                                                Column(
                                                  crossAxisAlignment: CrossAxisAlignment.end,
                                                  children: [
                                                    Text(
                                                      '$received / $expected ${line['uom'] ?? line['uOM'] ?? 'PCS'}',
                                                      style: TextStyle(
                                                        fontWeight: FontWeight.bold,
                                                        color: received == expected ? AppColors.success : AppColors.primary,
                                                      ),
                                                    ),
                                                    IconButton(
                                                      icon: const Icon(Icons.edit, color: AppColors.primary, size: 20),
                                                      onPressed: () => _showManualEntryDialog(line),
                                                      tooltip: 'Nhập thủ công (Số lượng, Lot, HSD)',
                                                    )
                                                  ],
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
