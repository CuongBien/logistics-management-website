import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/utils/scanner_helper.dart';
import '../../../../../core/constants/app_colors.dart';
import '../providers/outbound_provider.dart';

class DispatchLoadScreen extends ConsumerStatefulWidget {
  const DispatchLoadScreen({super.key});

  @override
  ConsumerState<DispatchLoadScreen> createState() => _DispatchLoadScreenState();
}

class _DispatchLoadScreenState extends ConsumerState<DispatchLoadScreen> {
  late final ScannerHelper _scannerHelper;
  final TextEditingController _inputController = TextEditingController();

  String _shipmentId = '';
  String _orderId = '';
  bool _isLoading = false;
  bool _isDispatched = false;

  @override
  void initState() {
    super.initState();
    _scannerHelper = ScannerHelper(onCodeScanned: _handleScan);
  }

  Future<void> _loadShipment(String code) async {
    if (code.isEmpty) return;
    setState(() {
      _isLoading = true;
      _shipmentId = '';
      _orderId = '';
      _isDispatched = false;
    });

    try {
      final repo = ref.read(outboundRepositoryProvider);

      if (code.startsWith('ORD-') || code.length >= 36) {
        // Có khả năng là Order ID, thử tra cứu Shipment tương ứng
        try {
          final shipmentId = await repo.getShipmentByOrder(code);
          setState(() {
            _shipmentId = shipmentId;
            _orderId = code;
            _isLoading = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('✅ Đã tìm thấy Shipment ID: $_shipmentId cho đơn hàng.'),
            backgroundColor: AppColors.success,
          ));
          return;
        } catch (_) {
          // Nếu tra cứu theo Order ID thất bại, giả định code chính là Shipment ID
        }
      }

      // Giả định code là Shipment ID trực tiếp
      setState(() {
        _shipmentId = code;
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('✅ Đã tải thông tin chuyến xe cho Shipment: $code'),
        backgroundColor: AppColors.success,
      ));
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('❌ Lỗi tải thông tin: ${e.toString().replaceAll('Exception: ', '')}'),
        backgroundColor: AppColors.error,
      ));
    }
  }

  void _handleScan(String code) {
    if (_isLoading) return;
    _inputController.text = code;
    _loadShipment(code.trim());
  }

  Future<void> _dispatch() async {
    if (_shipmentId.isEmpty) return;
    setState(() => _isLoading = true);

    try {
      final repo = ref.read(outboundRepositoryProvider);
      await repo.dispatchShipment(_shipmentId);

      setState(() {
        _isDispatched = true;
        _isLoading = false;
      });

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
          content: Text('Chuyến hàng $_shipmentId đã chính thức lăn bánh xuất kho!\nTrạng thái giao nhận đã được đồng bộ 100% lên hệ thống.'),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog
                Navigator.pop(context); // Go back to home
              },
              child: const Text('XÁC NHẬN'),
            )
          ],
        ),
      );
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('❌ Lỗi xuất bến: ${e.toString().replaceAll('Exception: ', '')}'),
        backgroundColor: AppColors.error,
      ));
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
        body: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Card Nhập Mã
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
                            labelText: 'Quét / Nhập Order ID hoặc Shipment ID',
                            prefixIcon: Icon(Icons.qr_code_scanner),
                            border: OutlineInputBorder(),
                          ),
                          onSubmitted: (value) {
                            if (value.isNotEmpty) _loadShipment(value.trim());
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: () {
                          _loadShipment(_inputController.text.trim());
                        },
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                        ),
                        child: const Icon(Icons.search),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Trạng thái chuyến hàng
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _shipmentId.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: const [
                                Icon(Icons.local_shipping, size: 80, color: AppColors.textSecondary),
                                SizedBox(height: 12),
                                Text(
                                  'Chưa quét chuyến hàng xuất xe.\nVui lòng quét Shipment ID để tiến hành xuất bến.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: AppColors.textSecondary, fontSize: 15),
                                )
                              ],
                            ),
                          )
                        : Column(
                            mainAxisAlignment: MainAxisAlignment.center,
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
                                    const Text('MÃ VẬN CHUYỂN (SHIPMENT ID)', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
                                    const SizedBox(height: 6),
                                    SelectableText(
                                      _shipmentId,
                                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                                      textAlign: TextAlign.center,
                                    ),
                                    if (_orderId.isNotEmpty) ...[
                                      const SizedBox(height: 12),
                                      Text('Mã Đơn hàng: $_orderId', style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                                    ]
                                  ],
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
                                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                                    textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                  ),
                                )
                            ],
                          ),
              ),

              if (_shipmentId.isNotEmpty && !_isDispatched)
                ElevatedButton.icon(
                  onPressed: _showManualInputDialog,
                  icon: const Icon(Icons.keyboard),
                  label: const Text('Nhập mã thủ công'),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
