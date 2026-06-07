enum NotificationType {
  info,
  warning,
  success,
  error;

  static NotificationType fromString(String value) {
    switch (value.toLowerCase()) {
      case 'warning':
        return NotificationType.warning;
      case 'success':
        return NotificationType.success;
      case 'error':
        return NotificationType.error;
      case 'info':
      default:
        return NotificationType.info;
    }
  }
}

enum NotificationCategory {
  inboundCreated,
  putawayCompleted,
  highPriorityOutbound,
  wavePickedReadyForDispatch,
  shortPick,
  lowStock,
  rtoReceived,
  integrationFailure,
  unknown;

  static NotificationCategory fromString(String value) {
    switch (value) {
      case 'InboundCreated':
        return NotificationCategory.inboundCreated;
      case 'PutawayCompleted':
        return NotificationCategory.putawayCompleted;
      case 'HighPriorityOutbound':
        return NotificationCategory.highPriorityOutbound;
      case 'WavePickedReadyForDispatch':
        return NotificationCategory.wavePickedReadyForDispatch;
      case 'ShortPick':
        return NotificationCategory.shortPick;
      case 'LowStock':
        return NotificationCategory.lowStock;
      case 'RtoReceived':
        return NotificationCategory.rtoReceived;
      case 'IntegrationFailure':
        return NotificationCategory.integrationFailure;
      default:
        return NotificationCategory.unknown;
    }
  }

  String get displayVietnamese {
    switch (this) {
      case NotificationCategory.inboundCreated:
        return 'Nhận hàng mới';
      case NotificationCategory.putawayCompleted:
        return 'Hoàn thành cất hàng';
      case NotificationCategory.highPriorityOutbound:
        return 'Đơn hàng ưu tiên cao';
      case NotificationCategory.wavePickedReadyForDispatch:
        return 'Sắp xếp xuất bến';
      case NotificationCategory.shortPick:
        return 'Báo thiếu hàng (Short Pick)';
      case NotificationCategory.lowStock:
        return 'Cảnh báo tồn kho thấp';
      case NotificationCategory.rtoReceived:
        return 'Nhận hàng hoàn';
      case NotificationCategory.integrationFailure:
        return 'Lỗi tích hợp hệ thống';
      case NotificationCategory.unknown:
      default:
        return 'Thông báo hệ thống';
    }
  }
}

class AppNotification {
  final String id;
  final String title;
  final String message;
  final NotificationType type;
  final NotificationCategory category;
  final DateTime createdAt;
  final bool isRead;

  const AppNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.category,
    required this.createdAt,
    required this.isRead,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String? ?? json['Id'] as String? ?? '',
      title: json['title'] as String? ?? json['Title'] as String? ?? '',
      message: json['message'] as String? ?? json['Message'] as String? ?? '',
      type: NotificationType.fromString(json['type'] as String? ?? json['Type'] as String? ?? 'info'),
      category: NotificationCategory.fromString(json['category'] as String? ?? json['Category'] as String? ?? ''),
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'] as String)
          : json['CreatedAt'] != null 
              ? DateTime.parse(json['CreatedAt'] as String)
              : DateTime.now(),
      isRead: json['isRead'] as bool? ?? json['IsRead'] as bool? ?? false,
    );
  }

  AppNotification copyWith({
    String? id,
    String? title,
    String? message,
    NotificationType? type,
    NotificationCategory? category,
    DateTime? createdAt,
    bool? isRead,
  }) {
    return AppNotification(
      id: id ?? this.id,
      title: title ?? this.title,
      message: message ?? this.message,
      type: type ?? this.type,
      category: category ?? this.category,
      createdAt: createdAt ?? this.createdAt,
      isRead: isRead ?? this.isRead,
    );
  }
}
