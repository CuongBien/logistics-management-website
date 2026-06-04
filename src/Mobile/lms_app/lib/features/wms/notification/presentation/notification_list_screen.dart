import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../domain/notification_models.dart';
import '../providers/notification_providers.dart';

class NotificationListScreen extends ConsumerStatefulWidget {
  const NotificationListScreen({super.key});

  @override
  ConsumerState<NotificationListScreen> createState() => _NotificationListScreenState();
}

class _NotificationListScreenState extends ConsumerState<NotificationListScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _handleNotificationTap(AppNotification notification) {
    // Đánh dấu đã đọc
    if (!notification.isRead) {
      ref.read(notificationListProvider.notifier).markAsRead(notification.id);
    }

    // Chuyển hướng nghiệp vụ (Deep Linking)
    String? targetRoute;
    switch (notification.category) {
      case NotificationCategory.inboundCreated:
        targetRoute = '/wms/receive';
        break;
      case NotificationCategory.putawayCompleted:
        // Cần thông tin cụ thể, tạm thời đi tới menu Putaway
        targetRoute = '/main'; 
        break;
      case NotificationCategory.highPriorityOutbound:
      case NotificationCategory.shortPick:
        targetRoute = '/wms/pick';
        break;
      case NotificationCategory.wavePickedReadyForDispatch:
        targetRoute = '/wms/dispatch';
        break;
      case NotificationCategory.rtoReceived:
        targetRoute = '/wms/returns';
        break;
      default:
        break;
    }

    if (targetRoute != null) {
      if (mounted) {
        context.push(targetRoute);
      }
    } else {
      // Hiển thị Dialog chi tiết nếu không chuyển hướng
      _showDetailDialog(notification);
    }
  }

  void _showDetailDialog(AppNotification notification) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(notification.title),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                notification.category.displayVietnamese.toUpperCase(),
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                  letterSpacing: 1.1,
                ),
              ),
              const SizedBox(height: 12),
              Text(notification.message),
              const SizedBox(height: 12),
              Text(
                'Thời gian: ${notification.createdAt.toString().substring(0, 19)}',
                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Đóng'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final notifications = ref.watch(notificationListProvider);
    final unreadCount = ref.watch(unreadNotificationsCountProvider);

    final unreadNotifications = notifications.where((n) => !n.isRead).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Thông báo kho (Real-time)'),
        actions: [
          if (unreadCount > 0)
            TextButton.icon(
              onPressed: () {
                ref.read(notificationListProvider.notifier).markAllAsRead();
              },
              icon: const Icon(Icons.done_all, color: Colors.white, size: 20),
              label: const Text(
                'Đọc tất cả',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          tabs: [
            Tab(text: 'Tất cả (${notifications.length})'),
            Tab(text: 'Chưa đọc ($unreadCount)'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildNotificationList(notifications),
          _buildNotificationList(unreadNotifications),
        ],
      ),
    );
  }

  Widget _buildNotificationList(List<AppNotification> list) {
    if (list.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.notifications_off_outlined, size: 64, color: AppColors.textSecondary),
            SizedBox(height: 16),
            Text(
              'Không có thông báo nào',
              style: TextStyle(fontSize: 16, color: AppColors.textSecondary),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(notificationListProvider.notifier).fetchNotifications(),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: list.length,
        itemBuilder: (context, index) {
          final notification = list[index];
          return _buildNotificationCard(notification);
        },
      ),
    );
  }

  Widget _buildNotificationCard(AppNotification notification) {
    Color typeColor;
    IconData iconData;

    switch (notification.type) {
      case NotificationType.success:
        typeColor = AppColors.success;
        iconData = Icons.check_circle;
        break;
      case NotificationType.warning:
        typeColor = AppColors.warning;
        iconData = Icons.warning;
        break;
      case NotificationType.error:
        typeColor = AppColors.error;
        iconData = Icons.error;
        break;
      case NotificationType.info:
      default:
        typeColor = AppColors.primary;
        iconData = Icons.info;
        break;
    }

    return Dismissible(
      key: Key(notification.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: AppColors.success.withOpacity(0.8),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            Icon(Icons.check, color: Colors.white),
            SizedBox(width: 8),
            Text('Đã đọc', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
      confirmDismiss: (direction) async {
        if (!notification.isRead) {
          await ref.read(notificationListProvider.notifier).markAsRead(notification.id);
          return true;
        }
        return false;
      },
      child: Card(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        elevation: notification.isRead ? 1 : 3,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: !notification.isRead 
              ? BorderSide(color: typeColor.withOpacity(0.5), width: 1.5)
              : BorderSide(color: Colors.grey.withOpacity(0.1)),
        ),
        color: notification.isRead ? Colors.white : typeColor.withOpacity(0.04),
        child: ListTile(
          onTap: () => _handleNotificationTap(notification),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          leading: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: typeColor.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(iconData, color: typeColor, size: 24),
          ),
          title: Row(
            children: [
              Expanded(
                child: Text(
                  notification.title,
                  style: TextStyle(
                    fontWeight: notification.isRead ? FontWeight.normal : FontWeight.bold,
                    color: AppColors.textPrimary,
                    fontSize: 15,
                  ),
                ),
              ),
              if (!notification.isRead)
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: typeColor,
                    shape: BoxShape.circle,
                  ),
                )
            ],
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 6),
              Text(
                notification.message,
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    notification.category.displayVietnamese,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: typeColor,
                    ),
                  ),
                  Text(
                    _formatTime(notification.createdAt),
                    style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 1) {
      return 'Vừa xong';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes} phút trước';
    } else if (difference.inHours < 24) {
      return '${difference.inHours} giờ trước';
    } else {
      return '${dateTime.day}/${dateTime.month} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    }
  }
}
