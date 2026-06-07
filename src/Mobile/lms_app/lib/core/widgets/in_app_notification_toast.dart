import 'dart:ui';
import 'package:flutter/material.dart';
import '../../features/wms/notification/domain/notification_models.dart';
import '../constants/app_colors.dart';

class InAppNotificationToast {
  static OverlayEntry? _currentEntry;

  static void show({
    required BuildContext context,
    required AppNotification notification,
    required VoidCallback onTap,
  }) {
    // Nếu có toast cũ đang hiển thị, xóa nó trước
    dismiss();

    final overlayState = Overlay.of(context);

    // Xác định màu sắc, icon dựa trên type
    Color baseColor;
    IconData iconData;

    switch (notification.type) {
      case NotificationType.success:
        baseColor = AppColors.success;
        iconData = Icons.check_circle_outline;
        break;
      case NotificationType.warning:
        baseColor = AppColors.warning;
        iconData = Icons.warning_amber_outlined;
        break;
      case NotificationType.error:
        baseColor = AppColors.error;
        iconData = Icons.error_outline;
        break;
      case NotificationType.info:
      default:
        baseColor = AppColors.primary;
        iconData = Icons.info_outline;
        break;
    }

    _currentEntry = OverlayEntry(
      builder: (context) {
        return _ToastWidget(
          title: notification.title,
          message: notification.message,
          categoryName: notification.category.displayVietnamese,
          baseColor: baseColor,
          iconData: iconData,
          onTap: () {
            dismiss();
            onTap();
          },
          onDismiss: dismiss,
        );
      },
    );

    overlayState.insert(_currentEntry!);

    // Tự động đóng sau 4 giây
    Future.delayed(const Duration(seconds: 4), () {
      dismiss();
    });
  }

  static void dismiss() {
    _currentEntry?.remove();
    _currentEntry = null;
  }
}

class _ToastWidget extends StatefulWidget {
  final String title;
  final String message;
  final String categoryName;
  final Color baseColor;
  final IconData iconData;
  final VoidCallback onTap;
  final VoidCallback onDismiss;

  const _ToastWidget({
    required this.title,
    required this.message,
    required this.categoryName,
    required this.baseColor,
    required this.iconData,
    required this.onTap,
    required this.onDismiss,
  });

  @override
  State<_ToastWidget> createState() => _ToastWidgetState();
}

class _ToastWidgetState extends State<_ToastWidget> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _slideAnimation;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );

    _slideAnimation = Tween<double>(begin: -100, end: 0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );

    _opacityAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeIn),
    );

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final topPadding = mediaQuery.padding.top + 12;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Positioned(
          top: topPadding + _slideAnimation.value,
          left: 16,
          right: 16,
          child: Opacity(
            opacity: _opacityAnimation.value,
            child: child,
          ),
        );
      },
      child: GestureDetector(
        onTap: widget.onTap,
        child: Material(
          color: Colors.transparent,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.9),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: widget.baseColor.withOpacity(0.3),
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 16,
                      offset: const Offset(0, 8),
                    )
                  ],
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: widget.baseColor.withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        widget.iconData,
                        color: widget.baseColor,
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                widget.categoryName.toUpperCase(),
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: widget.baseColor,
                                  letterSpacing: 1.2,
                                ),
                              ),
                              GestureDetector(
                                onTap: widget.onDismiss,
                                child: const Icon(
                                  Icons.close,
                                  size: 16,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            widget.title,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            widget.message,
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
