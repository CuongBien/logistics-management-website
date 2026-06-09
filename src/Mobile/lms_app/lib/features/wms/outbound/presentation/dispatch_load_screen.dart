import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../../core/utils/scanner_helper.dart';
import '../../../../../core/constants/app_colors.dart';
import '../providers/outbound_provider.dart';
import '../../../../../core/widgets/camera_scanner_dialog.dart';
import '../../qr/providers/qr_providers.dart';
import '../../qr/domain/qr_models.dart';
import '../../../../../shared/widgets/progress_card.dart';
import '../../../../../core/network/offline_queue.dart';
import '../../../../../core/network/connectivity_service.dart';
import '../../../../../core/error/error_handler.dart';

class DispatchLoadScreen extends ConsumerStatefulWidget {
  final String? shipmentId;
  final String? initialOrder;
  const DispatchLoadScreen({super.key, this.shipmentId, this.initialOrder});

  @override
  ConsumerState<DispatchLoadScreen> createState() => _DispatchLoadScreenState();
}

class _DispatchLoadScreenState extends ConsumerState<DispatchLoadScreen> {
  late final ScannerHelper _scannerHelper;
  final TextEditingController _inputController = TextEditingController();

  String _shipmentId = '';
  String _shipmentNo = '';
  int _loadedOrders = 0;
  int _totalOrders = 0;
  bool _isLoading = false;
  bool _isDispatched = false;
  String _lastScanned = 'Chưa quét';
  List<dynamic> _orders = [];
  final Set<String> _expandedOrders = {};

  @override
  void initState() {
    super.initState();
    _scannerHelper = ScannerHelper(onCodeScanned: _handleScan);
    if (widget.shipmentId != null && widget.shipmentId!.isNotEmpty) {
      Future.microtask(() => _loadShipment(widget.shipmentId!));
    } else if (widget.initialOrder != null && widget.initialOrder!.isNotEmpty) {
      Future.microtask(() => _loadOrderOnVehicle(widget.initialOrder!));
    }
  }

  void _handleScan(String code) async {
    if (_isLoading) return;
    
    setState(() {
      _lastScanned = code;
    });

    // Nếu scan mã bắt đầu bằng SHP: hoặc dài và không phải là ORD-, coi là tải thông tin chuyến hàng
    if (code.startsWith('SHP:') || (code.length >= 36 && !code.startsWith('ORD-') && _shipmentId.isEmpty)) {
      _loadShipment(code);
      return;
    }

    // Các trường hợp khác coi là chất đơn hàng lên xe (Load mode)
    _loadOrderOnVehicle(code);
  }

  Future<void> _loadShipment(String code) async {
    setState(() {
      _isLoading = true;
      _isDispatched = false;
    });

    final isOffline = ref.read(isOnlineProvider).value == false;

    if (isOffline) {
      setState(() {
        _shipmentId = code;
        _shipmentNo = code.startsWith('SHP:') ? code.substring(4) : code;
        _orders = [];
        _totalOrders = 0;
        _loadedOrders = 0;
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('📥 Đã ghi nhận mã Shipment ngoại tuyến'),
        backgroundColor: AppColors.warning,
      ));
      return;
    }

    try {
      // 1. Nếu code có dạng UUID (độ dài 36), thử lookup trực tiếp trước
      if (code.length == 36 && !code.contains(':')) {
        try {
          final details = await ref.read(qrLookupServiceProvider).lookupShipment(shipmentId: code);
          setState(() {
            _shipmentId = code;
            _shipmentNo = (details['shipmentNo'] ?? details['ShipmentNo'])?.toString() ?? 'N/A';
            final rawOrders = details['orders'] ?? details['Orders'];
            final orders = rawOrders != null ? List<dynamic>.from(rawOrders) : [];
            _orders = orders;
            _totalOrders = orders.length;
            _loadedOrders = orders.where((o) {
              final s = (o['status'] ?? o['Status'])?.toString().toLowerCase() ?? '';
              return s == 'loaded' || s == 'shipped' || s == '10' || s == '11';
            }).length;
            _isLoading = false;
          });
          return;
        } catch (_) {}
      }

      // 2. Thử parse QR
      final parsed = await ref.read(qrLookupServiceProvider).parse(rawValue: code);
      if (parsed.type == QrType.shipment) {
        final targetId = parsed.entityId ?? code;
        final details = await ref.read(qrLookupServiceProvider).lookupShipment(shipmentId: targetId);
        setState(() {
          _shipmentId = targetId;
          _shipmentNo = (details['shipmentNo'] ?? details['ShipmentNo'])?.toString() ?? 'N/A';
          final rawOrders = details['orders'] ?? details['Orders'];
          final orders = rawOrders != null ? List<dynamic>.from(rawOrders) : [];
          _orders = orders;
          _totalOrders = orders.length;
          _loadedOrders = orders.where((o) {
            final s = (o['status'] ?? o['Status'])?.toString().toLowerCase() ?? '';
            return s == 'loaded' || s == 'shipped' || s == '10' || s == '11';
          }).length;
          _isLoading = false;
        });
      } else {
        // Thử lookup trực tiếp bằng code nếu parse không nhận diện nhưng có thể là ID/No
        try {
          final details = await ref.read(qrLookupServiceProvider).lookupShipment(shipmentId: code);
          setState(() {
            _shipmentId = (details['id'] ?? details['Id'])?.toString() ?? code;
            _shipmentNo = (details['shipmentNo'] ?? details['ShipmentNo'])?.toString() ?? 'N/A';
            final rawOrders = details['orders'] ?? details['Orders'];
            final orders = rawOrders != null ? List<dynamic>.from(rawOrders) : [];
            _orders = orders;
            _totalOrders = orders.length;
            _loadedOrders = orders.where((o) {
              final s = (o['status'] ?? o['Status'])?.toString().toLowerCase() ?? '';
              return s == 'loaded' || s == 'shipped' || s == '10' || s == '11';
            }).length;
            _isLoading = false;
          });
        } catch (_) {
          setState(() {
            _shipmentId = code;
            _shipmentNo = code;
            _orders = [];
            _totalOrders = 0;
            _loadedOrders = 0;
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      setState(() {
        _shipmentId = code;
        _shipmentNo = code;
        _orders = [];
        _totalOrders = 0;
        _loadedOrders = 0;
        _isLoading = false;
      });
    }
  }

  Future<void> _loadOrderOnVehicle(String code) async {
    setState(() => _isLoading = true);

    final isOffline = ref.read(isOnlineProvider).value == false;

    if (isOffline) {
      final actionId = DateTime.now().microsecondsSinceEpoch.toString();
      final body = {
        'scannedOrder': code,
        'shipmentId': _shipmentId.isNotEmpty ? _shipmentId : null,
      };

      try {
        final queue = ref.read(offlineQueueProvider);
        await queue.enqueue(OfflineAction(
          id: actionId,
          actionType: 'scan-load',
          endpoint: '/qrcode/actions/scan-load',
          method: 'POST',
          body: body,
          createdAt: DateTime.now(),
        ));

        ref.read(pendingCountProvider.notifier).set(queue.pendingCount);

        setState(() {
          _isLoading = false;
          _loadedOrders++;
          if (_totalOrders > 0 && _loadedOrders > _totalOrders) {
            _totalOrders = _loadedOrders;
          }
        });

        HapticFeedback.lightImpact();

        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('📥 Đã lưu ngoại tuyến xếp đơn hàng: $code'),
          backgroundColor: AppColors.warning,
        ));
      } catch (e) {
        HapticFeedback.vibrate();
        setState(() => _isLoading = false);
        if (mounted) {
          ErrorHandler.showError(context, e);
        }
      }
      return;
    }

    try {
      final qrActionService = ref.read(qrActionServiceProvider);
      final response = await qrActionService.scanLoad(
        scannedOrder: code,
        shipmentId: _shipmentId.isNotEmpty ? _shipmentId : null,
      );

      await _loadShipment(response.shipmentId);

      HapticFeedback.lightImpact();

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('✅ Đã xếp đơn hàng ${response.orderNo} lên xe thành công!'),
        backgroundColor: AppColors.success,
      ));
    } catch (e) {
      HapticFeedback.vibrate();
      setState(() => _isLoading = false);
      if (mounted) {
        ErrorHandler.showError(context, e);
      }
    }
  }

  Future<void> _dispatch() async {
    if (_shipmentId.isEmpty) return;
    setState(() => _isLoading = true);

    final isOffline = ref.read(isOnlineProvider).value == false;

    if (isOffline) {
      final actionId = DateTime.now().microsecondsSinceEpoch.toString();
      final body = {
        'shipmentId': _shipmentId,
      };

      try {
        final queue = ref.read(offlineQueueProvider);
        await queue.enqueue(OfflineAction(
          id: actionId,
          actionType: 'dispatch-shipment',
          endpoint: '/outbound/shipments/$_shipmentId/dispatch', // match endpoint
          method: 'POST',
          body: body,
          createdAt: DateTime.now(),
        ));

        ref.read(pendingCountProvider.notifier).set(queue.pendingCount);

        setState(() {
          _isDispatched = true;
          _isLoading = false;
        });

        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('📥 Đã lưu ngoại tuyến lệnh xuất bến chuyến xe'),
          backgroundColor: AppColors.warning,
        ));
        
        if (mounted) {
          context.pop();
        }
      } catch (e) {
        setState(() => _isLoading = false);
        if (mounted) {
          ErrorHandler.showError(context, e);
        }
      }
      return;
    }

    try {
      final repo = ref.read(outboundRepositoryProvider);
      await repo.dispatchShipment(_shipmentId);

      setState(() {
        _isDispatched = true;
        _isLoading = false;
      });

      HapticFeedback.heavyImpact();

      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.local_shipping, color: AppColors.success, size: 28),
                SizedBox(width: 8),
                Text('Đã xuất bến thành công!'),
              ],
            ),
            content: Text('Chuyến hàng $_shipmentNo đã chính thức lăn bánh xuất kho!\nTrạng thái đã được cập nhật thành công lên server.'),
            actions: [
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.pop(context);
                },
                child: const Text('XÁC NHẬN'),
              )
            ],
          ),
        );
      }
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
              hintText: 'Nhập mã Order ID / Shipment ID...',
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
    _inputController.dispose();
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
        appBar: AppBar(title: const Text('Xuất bến (Dispatch/Load)')),
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
                          controller: _inputController,
                          decoration: const InputDecoration(
                            labelText: 'Quét đơn xếp xe / Quét Shipment ID',
                            prefixIcon: Icon(Icons.qr_code_scanner),
                            border: OutlineInputBorder(),
                          ),
                          onSubmitted: (value) {
                            if (value.isNotEmpty) {
                              _handleScan(value.trim());
                              _inputController.clear();
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: () {
                          if (_inputController.text.isNotEmpty) {
                            _handleScan(_inputController.text.trim());
                            _inputController.clear();
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
              const SizedBox(height: 16),

              if (_isLoading)
                const Center(child: Padding(padding: EdgeInsets.all(32.0), child: CircularProgressIndicator()))
              else if (_shipmentId.isEmpty)
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      SizedBox(height: 48),
                      Icon(Icons.local_shipping, size: 80, color: AppColors.textSecondary),
                      SizedBox(height: 12),
                      Text(
                        'Chưa quét chuyến hàng xuất xe.\nVui lòng quét đơn hàng hoặc Shipment ID.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 15),
                      )
                    ],
                  ),
                )
              else
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: _isDispatched ? AppColors.success.withValues(alpha: 0.12) : AppColors.primary.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: _isDispatched ? AppColors.success : AppColors.primary, width: 2),
                      ),
                      child: Column(
                        children: [
                          Icon(
                            _isDispatched ? Icons.check_circle : Icons.local_shipping,
                            size: 72,
                            color: _isDispatched ? AppColors.success : AppColors.primary,
                          ),
                          const SizedBox(height: 16),
                          const Text('CHUYẾN HÀNG (SHIPMENT NO)', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
                          const SizedBox(height: 6),
                          Text(
                            _shipmentNo,
                            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    if (_totalOrders > 0)
                      ProgressCard(
                        title: 'Tiến độ chất hàng lên xe',
                        current: _loadedOrders,
                        total: _totalOrders,
                        unit: 'đơn',
                      )
                    else
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Text(
                            'Đơn đã xếp lên xe: $_loadedOrders',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                    const SizedBox(height: 24),
                    const Text(
                      'DANH SÁCH ĐƠN HÀNG TRONG CHUYẾN',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (_orders.isEmpty)
                      const Card(
                        child: Padding(
                          padding: EdgeInsets.all(16.0),
                          child: Text(
                            'Chưa có đơn hàng nào trong chuyến xe này',
                            style: TextStyle(color: AppColors.textSecondary),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _orders.length,
                        itemBuilder: (context, index) {
                          final order = _orders[index];
                          final orderId = (order['id'] ?? order['Id'])?.toString() ?? '';
                          final orderNo = (order['orderNo'] ?? order['OrderNo'])?.toString() ?? 'N/A';
                          final status = (order['status'] ?? order['Status'])?.toString() ?? 'N/A';
                          final isLoaded = status.toLowerCase() == 'loaded' || status.toLowerCase() == 'shipped' || status == '10' || status == '11';
                          final orderLines = (order['lines'] ?? order['Lines']) as List<dynamic>? ?? [];

                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                ListTile(
                                  leading: Icon(
                                    isLoaded ? Icons.check_circle : Icons.radio_button_unchecked,
                                    color: isLoaded ? AppColors.success : AppColors.textSecondary,
                                  ),
                                  title: Text(
                                    orderNo,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                  ),
                                  subtitle: Text(
                                    'Trạng thái: ${isLoaded ? "Đã lên xe (Loaded)" : "Chờ xếp xe ($status)"}',
                                    style: TextStyle(
                                      color: isLoaded ? AppColors.success : AppColors.warning,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  trailing: Icon(
                                    _expandedOrders.contains(orderId) ? Icons.expand_less : Icons.expand_more,
                                  ),
                                  onTap: () {
                                    setState(() {
                                      if (_expandedOrders.contains(orderId)) {
                                        _expandedOrders.remove(orderId);
                                      } else {
                                        _expandedOrders.add(orderId);
                                      }
                                    });
                                  },
                                ),
                                if (_expandedOrders.contains(orderId)) ...[
                                  const Divider(height: 1),
                                  Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text(
                                          'Sản phẩm trong đơn:',
                                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textSecondary),
                                        ),
                                        const SizedBox(height: 8),
                                        if (orderLines.isEmpty)
                                          const Text('Không có chi tiết sản phẩm', style: TextStyle(fontStyle: FontStyle.italic))
                                        else
                                          ...orderLines.map((line) {
                                            final sku = (line['sku'] ?? line['Sku'])?.toString() ?? 'N/A';
                                            final qty = line['quantity'] ?? line['Quantity'] ?? 0;
                                            return Padding(
                                              padding: const EdgeInsets.symmetric(vertical: 4),
                                              child: Row(
                                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                children: [
                                                  Text(sku, style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w600)),
                                                  Text('$qty PCS', style: const TextStyle(fontWeight: FontWeight.bold)),
                                                ],
                                              ),
                                            );
                                          }).toList(),
                                      ],
                                    ),
                                  ),
                                ]
                              ],
                            ),
                          );
                        },
                      ),
                    const SizedBox(height: 32),
                    if (!_isDispatched)
                      ElevatedButton.icon(
                        onPressed: _dispatch,
                        icon: const Icon(Icons.check_circle_outline),
                        label: const Text('XÁC NHẬN XE XUẤT BẾN'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                      )
                  ],
                ),
              
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.qr_code_scanner, color: AppColors.primary, size: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Sẵn sàng quét...', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
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
            ],
          ),
        ),
      ),
    );
  }
}
