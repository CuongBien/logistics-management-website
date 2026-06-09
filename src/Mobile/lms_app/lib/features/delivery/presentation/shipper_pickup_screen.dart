import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/camera_scanner_dialog.dart';
import '../../../../core/error/error_handler.dart';
import '../providers/delivery_provider.dart';

class ShipperPickupScreen extends ConsumerStatefulWidget {
  const ShipperPickupScreen({super.key});

  @override
  ConsumerState<ShipperPickupScreen> createState() => _ShipperPickupScreenState();
}

class _ShipperPickupScreenState extends ConsumerState<ShipperPickupScreen> {
  final TextEditingController _orderController = TextEditingController();
  bool _isLoading = false;

  Future<void> _scanOrderWithCamera() async {
    final result = await showDialog<String>(
      context: context,
      builder: (context) => const CameraScannerDialog(),
    );
    if (result != null && result.isNotEmpty) {
      String cleanCode = result;
      if (result.startsWith('ORD:')) cleanCode = result.substring(4);
      _orderController.text = cleanCode;
      _confirmPickup();
    }
  }

  Future<void> _confirmPickup() async {
    final orderId = _orderController.text.trim();
    if (orderId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Vui lòng quét hoặc nhập mã Đơn hàng (Order ID)!'),
        backgroundColor: AppColors.warning,
      ));
      return;
    }

    setState(() => _isLoading = true);
    try {
      final repo = ref.read(deliveryRepositoryProvider);
      // Hardcode driver ID for demo
      await repo.pickupOrder(orderId, 'DRIVER-001');

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('✅ Lấy hàng thành công! Đơn hàng đã giao cho Shipper.'),
          backgroundColor: AppColors.success,
        ));
        _orderController.clear();
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

  @override
  void dispose() {
    _orderController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Shipper Lấy Hàng (Pickup)')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.delivery_dining, size: 100, color: Colors.indigo),
            const SizedBox(height: 32),
            const Text(
              'Xác nhận Lấy hàng (Pickup)',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            const Text(
              'Dành cho tài xế/Shipper quét mã đơn hàng khi nhận hàng từ kho.',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 16),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 48),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _orderController,
                    decoration: const InputDecoration(
                      labelText: 'Mã Đơn hàng (Order ID)',
                      prefixIcon: Icon(Icons.receipt_long),
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: (_) => _confirmPickup(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  onPressed: _scanOrderWithCamera,
                  icon: const Icon(Icons.camera_alt),
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.indigo,
                    padding: const EdgeInsets.all(16),
                  ),
                )
              ],
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _isLoading ? null : _confirmPickup,
              icon: _isLoading 
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
                : const Icon(Icons.check_circle),
              label: const Text('XÁC NHẬN LẤY HÀNG', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.indigo,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            )
          ],
        ),
      ),
    );
  }
}
