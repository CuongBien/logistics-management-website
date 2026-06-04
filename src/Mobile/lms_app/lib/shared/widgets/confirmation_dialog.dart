import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

/// Dialog xác nhận hành động với 2 nút: Hủy / Xác nhận.
/// Hỗ trợ chế độ isDangerous để hiển thị nút xác nhận màu đỏ.
class ConfirmationDialog {
  /// Hiển thị dialog xác nhận và trả về kết quả true/false.
  ///
  /// [title]: Tiêu đề dialog
  /// [message]: Nội dung thông báo
  /// [confirmText]: Nhãn nút xác nhận (mặc định: 'Xác nhận')
  /// [cancelText]: Nhãn nút hủy (mặc định: 'Hủy')
  /// [confirmColor]: Màu nút xác nhận (mặc định: AppColors.primary)
  /// [icon]: Icon hiển thị bên cạnh tiêu đề
  /// [isDangerous]: Nếu true, nút xác nhận sẽ có màu đỏ (AppColors.error)
  static Future<bool> show({
    required BuildContext context,
    required String title,
    required String message,
    String confirmText = 'Xác nhận',
    String cancelText = 'Hủy',
    Color? confirmColor,
    IconData? icon,
    bool isDangerous = false,
  }) async {
    // Nếu hành động nguy hiểm, ưu tiên dùng màu đỏ
    final buttonColor = isDangerous
        ? AppColors.error
        : (confirmColor ?? AppColors.primary);

    final result = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Row(
            children: [
              if (icon != null) ...[
                Icon(icon, color: buttonColor, size: 28),
                const SizedBox(width: 8),
              ],
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          content: Text(
            message,
            style: const TextStyle(fontSize: 15),
          ),
          actions: [
            // Nút Hủy
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text(cancelText),
            ),
            // Nút Xác nhận
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: buttonColor,
                foregroundColor: Colors.white,
              ),
              child: Text(confirmText),
            ),
          ],
        );
      },
    );

    return result ?? false;
  }
}
