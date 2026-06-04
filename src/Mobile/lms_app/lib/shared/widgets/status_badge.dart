import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

/// Enum phân loại trạng thái hiển thị trên badge
enum StatusType {
  pending,
  active,
  success,
  error,
  warning,
  info,
}

/// Widget badge hiển thị trạng thái với màu sắc tương ứng.
/// Dạng pill (bo tròn), có viền và nền mờ theo loại trạng thái.
class StatusBadge extends StatelessWidget {
  /// Nội dung hiển thị trên badge
  final String label;

  /// Loại trạng thái quyết định màu sắc
  final StatusType type;

  const StatusBadge({
    super.key,
    required this.label,
    required this.type,
  });

  /// Lấy màu tương ứng với từng loại trạng thái
  Color _getColor() {
    switch (type) {
      case StatusType.pending:
        return AppColors.warning;
      case StatusType.active:
        return AppColors.primary;
      case StatusType.success:
        return AppColors.success;
      case StatusType.error:
        return AppColors.error;
      case StatusType.warning:
        return AppColors.warning;
      case StatusType.info:
        return AppColors.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _getColor();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 13,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
