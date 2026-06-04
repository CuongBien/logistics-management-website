import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

/// Widget hiển thị tiến độ dạng card có thanh progress bar.
/// Dùng cho các màn hình theo dõi tiến độ nhận hàng, đóng gói, v.v.
class ProgressCard extends StatelessWidget {
  /// Tiêu đề card (ví dụ: 'Tiến độ nhận hàng')
  final String title;

  /// Số lượng hiện tại đã hoàn thành
  final int current;

  /// Tổng số lượng cần hoàn thành
  final int total;

  /// Đơn vị hiển thị (ví dụ: 'kiện', 'sản phẩm')
  final String? unit;

  /// Màu chủ đạo của progress bar
  final Color? color;

  /// Icon hiển thị bên cạnh tiêu đề
  final IconData? icon;

  const ProgressCard({
    super.key,
    required this.title,
    required this.current,
    required this.total,
    this.unit,
    this.color,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final progressColor = color ?? AppColors.primary;
    // Tránh chia cho 0
    final progress = total > 0 ? current / total : 0.0;
    final percentage = (progress * 100).toStringAsFixed(0);

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Tiêu đề với icon
            Row(
              children: [
                if (icon != null) ...[
                  Icon(icon, color: progressColor, size: 24),
                  const SizedBox(width: 8),
                ],
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Thanh tiến độ
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progress.clamp(0.0, 1.0),
                color: progressColor,
                backgroundColor: progressColor.withOpacity(0.15),
                minHeight: 8,
              ),
            ),
            const SizedBox(height: 8),
            // Thông tin số lượng và phần trăm
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '$current / $total ${unit ?? ''}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '$percentage%',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: progressColor,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
