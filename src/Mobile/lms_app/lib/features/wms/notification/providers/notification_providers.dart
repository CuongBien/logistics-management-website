import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/app_config.dart';
import '../domain/notification_models.dart';
import '../services/notification_service.dart';

/// Provider cung cấp NotificationService toàn cục.
/// Sử dụng trực tiếp thực thể global apiClient.
final notificationServiceProvider = Provider<NotificationService>((ref) {
  final config = ref.watch(appConfigProvider);
  final service = NotificationService(apiClient: apiClient, config: config);
  
  ref.onDispose(() {
    service.dispose();
  });
  
  return service;
});

/// Quản lý danh sách thông báo sử dụng mẫu Notifier của Riverpod v3.0
class NotificationListNotifier extends Notifier<List<AppNotification>> {
  StreamSubscription<AppNotification>? _subscription;

  @override
  List<AppNotification> build() {
    ref.onDispose(() {
      _subscription?.cancel();
    });

    final service = ref.watch(notificationServiceProvider);
    
    // Lắng nghe sự kiện SignalR thời gian thực để tự động thêm thông báo
    _subscription = service.notificationStream.listen((newNotification) {
      state = [
        newNotification,
        ...state.where((n) => n.id != newNotification.id),
      ];
    });

    // Tải lịch sử thông báo ban đầu
    fetchNotifications();

    return [];
  }

  Future<void> fetchNotifications() async {
    try {
      final service = ref.read(notificationServiceProvider);
      final list = await service.getNotifications();
      state = list;
    } catch (_) {
      // Bỏ qua lỗi kết nối ban đầu
    }
  }

  Future<void> markAsRead(String id) async {
    final service = ref.read(notificationServiceProvider);
    final success = await service.markAsRead(id);
    if (success) {
      state = state.map((n) {
        if (n.id == id) {
          return n.copyWith(isRead: true);
        }
        return n;
      }).toList();
    }
  }

  Future<void> markAllAsRead() async {
    final service = ref.read(notificationServiceProvider);
    final success = await service.markAllAsRead();
    if (success) {
      state = state.map((n) => n.copyWith(isRead: true)).toList();
    }
  }
}

/// Provider cung cấp danh sách thông báo và các phương thức xử lý (đọc, cập nhật)
final notificationListProvider = NotifierProvider<NotificationListNotifier, List<AppNotification>>(
  NotificationListNotifier.new,
);

/// Provider tính toán số lượng thông báo chưa đọc
final unreadNotificationsCountProvider = Provider<int>((ref) {
  final list = ref.watch(notificationListProvider);
  return list.where((n) => !n.isRead).length;
});

/// Provider lắng nghe trực tiếp thông báo mới từ SignalR
final notificationIncomingStreamProvider = StreamProvider<AppNotification>((ref) {
  final service = ref.watch(notificationServiceProvider);
  return service.notificationStream;
});
