import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/widgets/camera_scanner_dialog.dart';

/// Widget nhập liệu kết hợp quét mã: TextField + Camera + Nhập thủ công.
/// Dùng chung cho tất cả các màn hình cần quét barcode/QR.
class ScanInputField extends StatelessWidget {
  /// Controller cho ô nhập liệu
  final TextEditingController controller;

  /// Label hiển thị trên ô nhập (ví dụ: 'Quét mã Order ID')
  final String label;

  /// Icon hiển thị bên trái ô nhập
  final IconData prefixIcon;

  /// Callback khi người dùng submit (bấm Enter hoặc nhập thủ công)
  final Function(String) onSubmitted;

  /// Callback riêng khi quét camera (nếu null thì dùng onSubmitted)
  final Function(String)? onCameraScanned;

  /// Cho phép tương tác hay không
  final bool enabled;

  /// Hiển thị nút quét camera
  final bool showCameraButton;

  /// Hint text cho ô nhập
  final String? hintText;

  const ScanInputField({
    super.key,
    required this.controller,
    required this.label,
    this.prefixIcon = Icons.qr_code_scanner,
    required this.onSubmitted,
    this.onCameraScanned,
    this.enabled = true,
    this.showCameraButton = true,
    this.hintText,
  });

  /// Mở dialog camera để quét mã vạch
  Future<void> _openCameraScanner(BuildContext context) async {
    final result = await showDialog<String>(
      context: context,
      builder: (context) => const CameraScannerDialog(),
    );
    if (result != null && result.isNotEmpty) {
      controller.text = result;
      if (onCameraScanned != null) {
        onCameraScanned!(result);
      } else {
        onSubmitted(result);
      }
    }
  }

  /// Mở dialog nhập mã thủ công bằng bàn phím
  void _showManualInputDialog(BuildContext context) {
    final TextEditingController manualController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Nhập mã thủ công'),
          content: TextField(
            controller: manualController,
            decoration: InputDecoration(
              hintText: hintText ?? 'Nhập mã...',
              border: const OutlineInputBorder(),
            ),
            autofocus: true,
            onSubmitted: (value) {
              Navigator.pop(context);
              if (value.isNotEmpty) {
                controller.text = value.trim();
                onSubmitted(value.trim());
              }
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
                if (manualController.text.isNotEmpty) {
                  controller.text = manualController.text.trim();
                  onSubmitted(manualController.text.trim());
                }
              },
              child: const Text('Xác nhận'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Ô nhập liệu chính
        Expanded(
          child: TextField(
            controller: controller,
            enabled: enabled,
            decoration: InputDecoration(
              labelText: label,
              hintText: hintText,
              prefixIcon: Icon(prefixIcon),
              border: const OutlineInputBorder(),
            ),
            onSubmitted: (value) {
              if (value.isNotEmpty) onSubmitted(value.trim());
            },
          ),
        ),
        const SizedBox(width: 8),
        // Nút quét camera
        if (showCameraButton)
          IconButton(
            onPressed: enabled ? () => _openCameraScanner(context) : null,
            icon: const Icon(Icons.camera_alt),
            color: AppColors.primary,
            tooltip: 'Quét bằng camera',
            iconSize: 28,
          ),
        // Nút nhập thủ công
        IconButton(
          onPressed: enabled ? () => _showManualInputDialog(context) : null,
          icon: const Icon(Icons.keyboard),
          color: AppColors.textSecondary,
          tooltip: 'Nhập thủ công',
          iconSize: 28,
        ),
      ],
    );
  }
}
