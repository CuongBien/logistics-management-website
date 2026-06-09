import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../constants/app_colors.dart';
import '../../features/auth/providers/auth_provider.dart';
import 'app_exception.dart';

/// Lớp xử lý lỗi tập trung cho toàn bộ ứng dụng.
/// Chuyển đổi mọi loại lỗi thành AppException và hiển thị SnackBar phù hợp.
class ErrorHandler {
  /// Hiển thị thông báo lỗi dưới dạng SnackBar với màu sắc và icon phù hợp
  /// theo loại lỗi cụ thể.
  static void showError(BuildContext context, Object error) {
    final appException = parse(error);

    // Xác định màu nền và icon dựa trên loại exception
    final Color backgroundColor;
    final IconData icon;
    final VoidCallback? action;
    String? actionLabel;

    switch (appException) {
      case NetworkException():
        backgroundColor = AppColors.warning;
        icon = Icons.wifi_off_rounded;
        action = null;
        break;
      case AuthException():
        backgroundColor = AppColors.error;
        icon = Icons.lock_outline_rounded;
        if (appException.statusCode == 403 || appException.code == 'Operator.Forbidden') {
          action = null;
          break;
        }
        actionLabel = 'Đăng nhập';
        action = () {
          try {
            ProviderScope.containerOf(context).read(authProvider.notifier).logout();
          } catch (_) {
            Navigator.of(context).pushNamedAndRemoveUntil('/login', (_) => false);
          }
        };
        // Tự động gọi logout để chuyển hướng về màn hình đăng nhập thông qua GoRouter
        WidgetsBinding.instance.addPostFrameCallback((_) {
          try {
            ProviderScope.containerOf(context).read(authProvider.notifier).logout();
          } catch (_) {}
        });
        break;
      case QrException():
        backgroundColor = AppColors.error;
        icon = Icons.qr_code_2_rounded;
        action = null;
        break;
      case ValidationException():
        backgroundColor = AppColors.warning;
        icon = Icons.warning_amber_rounded;
        action = null;
        break;
      default:
        backgroundColor = AppColors.error;
        icon = Icons.error_outline_rounded;
        action = null;
    }

    // Lấy message hiển thị - ưu tiên friendlyMessage cho QrException
    final displayMessage = appException is QrException
        ? appException.friendlyMessage
        : appException.message;

    // Xác định màu chữ phù hợp với màu nền
    final textColor = backgroundColor == AppColors.warning
        ? AppColors.textPrimary
        : Colors.white;

    final snackBar = SnackBar(
      content: Row(
        children: [
          Icon(icon, color: textColor, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              displayMessage,
              style: TextStyle(
                color: textColor,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
      backgroundColor: backgroundColor,
      behavior: SnackBarBehavior.floating,
      margin: const EdgeInsets.all(16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      duration: const Duration(seconds: 4),
      action: action != null
          ? SnackBarAction(
              label: actionLabel ?? 'OK',
              textColor: textColor,
              onPressed: action,
            )
          : null,
    );

    // Đảm bảo context vẫn mounted trước khi hiển thị SnackBar
    if (context.mounted) {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(snackBar);
    }
  }

  /// Chuyển đổi bất kỳ loại error nào thành AppException.
  /// Hỗ trợ DioException, AppException, và các loại exception khác.
  static AppException parse(Object error) {
    if (error is AppException) {
      return error;
    }

    if (error is DioException) {
      return AppException.fromDioException(error);
    }

    if (error is FormatException) {
      return ValidationException(
        'Dữ liệu không đúng định dạng: ${error.message}',
        code: 'Validation.Format',
      );
    }

    if (error is TypeError) {
      return const AppException(
        'Lỗi xử lý dữ liệu không mong muốn',
        code: 'App.TypeError',
      );
    }

    // Fallback cho các lỗi không xác định
    return AppException(
      'Đã có lỗi xảy ra: ${error.toString()}',
      code: 'App.Unknown',
    );
  }
}
