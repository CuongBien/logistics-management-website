import 'dart:async';
import 'dart:developer' as dev;
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:signalr_netcore/signalr_client.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/app_config.dart';
import '../domain/notification_models.dart';

class NotificationService {
  final ApiClient _apiClient;
  final AppConfig _config;
  HubConnection? _hubConnection;
  StreamController<AppNotification>? _notificationStreamController;

  NotificationService({
    required ApiClient apiClient,
    required AppConfig config,
  })  : _apiClient = apiClient,
        _config = config;

  Stream<AppNotification> get notificationStream {
    _notificationStreamController ??= StreamController<AppNotification>.broadcast();
    return _notificationStreamController!.stream;
  }

  /// Tải lịch sử thông báo từ REST API
  Future<List<AppNotification>> getNotifications({int limit = 50}) async {
    try {
      final response = await _apiClient.dio.get(
        '/notifications',
        queryParameters: {'limit': limit},
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data as List<dynamic>;
        return data.map((json) => AppNotification.fromJson(json as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (e) {
      dev.log('Error fetching notifications: $e');
      rethrow;
    }
  }

  /// Đánh dấu một thông báo là đã đọc
  Future<bool> markAsRead(String id) async {
    try {
      final response = await _apiClient.dio.post('/notifications/$id/read');
      return response.statusCode == 200;
    } catch (e) {
      dev.log('Error marking notification as read: $e');
      return false;
    }
  }

  /// Đánh dấu tất cả thông báo là đã đọc
  Future<bool> markAllAsRead() async {
    try {
      final response = await _apiClient.dio.post('/notifications/mark-all-read');
      return response.statusCode == 200;
    } catch (e) {
      dev.log('Error marking all notifications as read: $e');
      return false;
    }
  }

  /// Khởi tạo và thiết lập kết nối SignalR
  Future<void> startConnection() async {
    if (_hubConnection != null && _hubConnection!.state == HubConnectionState.Connected) {
      dev.log('SignalR is already connected.');
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    if (token == null || token.isEmpty) {
      dev.log('Cannot connect to SignalR: Access token is missing.');
      return;
    }

    // Hub URL có dạng http://<host>:<port>/hubs/notification
    final hubUrl = '${_config.signalRUrl}/notification';
    dev.log('Connecting to SignalR Hub: $hubUrl');

    _hubConnection = HubConnectionBuilder()
        .withUrl(
          hubUrl,
          options: HttpConnectionOptions(
            accessTokenFactory: () async => token,
            transport: HttpTransportType.WebSockets,
            logMessageContent: true,
          ),
        )
        .withAutomaticReconnect()
        .build();

    // Lắng nghe sự kiện kết nối lại
    _hubConnection!.onreconnecting(({Exception? error}) {
      dev.log('SignalR Connection reconnecting due to error: $error');
    });

    _hubConnection!.onreconnected(({String? connectionId}) {
      dev.log('SignalR Connection reconnected. Id: $connectionId');
    });

    _hubConnection!.onclose(({Exception? error}) {
      dev.log('SignalR Connection closed: $error');
    });

    // Lắng nghe sự kiện từ backend gửi xuống
    _hubConnection!.on('ReceiveNotification', _handleReceiveNotification);

    try {
      await _hubConnection!.start();
      dev.log('SignalR Connected successfully! Connection ID: ${_hubConnection!.connectionId}');
    } catch (e) {
      dev.log('SignalR Connection Error: $e');
    }
  }

  /// Ngắt kết nối SignalR Hub
  Future<void> stopConnection() async {
    if (_hubConnection != null) {
      dev.log('Stopping SignalR Connection...');
      await _hubConnection!.stop();
      _hubConnection = null;
    }
  }

  /// Xử lý khi nhận được thông báo mới từ SignalR
  void _handleReceiveNotification(List<Object?>? arguments) {
    if (arguments == null || arguments.isEmpty) return;
    
    try {
      final json = arguments.first as Map<String, dynamic>;
      dev.log('SignalR received notification payload: $json');
      final notification = AppNotification.fromJson(json);
      
      if (_notificationStreamController != null && !_notificationStreamController!.isClosed) {
        _notificationStreamController!.add(notification);
      }
    } catch (e) {
      dev.log('Error parsing SignalR notification argument: $e');
    }
  }

  /// Giải phóng tài nguyên
  void dispose() {
    stopConnection();
    _notificationStreamController?.close();
  }
}
