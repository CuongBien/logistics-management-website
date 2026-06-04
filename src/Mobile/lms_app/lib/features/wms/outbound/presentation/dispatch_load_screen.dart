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
import '../../../../../core/error/app_exception.dart';
import '../../../../../core/error/error_handler.dart';

class DispatchLoadScreen extends ConsumerStatefulWidget {
  const DispatchLoadScreen({super.key});

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

  @override
  void initState() {
    super.initState();
    _scannerHelper = ScannerHelper(onCodeScanned: _handleScan);
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
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('📥 Đã ghi nhận mã Shipment ngoại tuyến'),
        backgroundColor: AppColors.warning,
      ));
      return;
    }

    try {
      // Gọi API parse/lookup thông tin shipment
      final parsed = await ref.read(qrLookupServiceProvider).parse(rawValue: code);
      if (parsed.type == QrType.shipment) {
        final targetId = parsed.entityId ?? code;
        final details = await ref.read(qrLookupServiceProvider).lookupShipment(shipmentId: targetId);
        setState(() {
          _shipmentId = targetId;
          _shipmentNo = details['shipmentNo']?.toString() ?? 'N/A';
          final orders = details['orders'] as List<dynamic>? ?? [];
          _totalOrders = orders.length;
          _loadedOrders = orders.where((o) => o['status'] == 'Loaded' || o['status'] == 'Shipped').length;
          _isLoading = false;
        });
      } else {
        setState(() {
          _shipmentId = code;
          _shipmentNo = code;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _shipmentId = code;
        _shipmentNo = code;
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

        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('📥 Đã lưu ngoại tuyến xếp đơn hàng: $code'),
          backgroundColor: AppColors.warning,
        ));
      } catch (e) {
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

      setState(() {
        _shipmentId = response.shipmentId;
        _shipmentNo = response.shipmentNo;
        _loadedOrders = response.loadProgress.loadedOrders;
        _totalOrders = response.loadProgress.totalOrders;
        _isLoading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('✅ Đã xếp đơn hàng ${response.orderNo} lên xe thành công!'),
        backgroundColor: AppColors.success,
      ));
    } catch (e) {
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
                        color: _isDispatched ? AppColors.success.withOpacity(0.12) : AppColors.primary.withOpacity(0.08),
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
                  color: AppColors.primary.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.primary.withOpacity(0.3)),
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
