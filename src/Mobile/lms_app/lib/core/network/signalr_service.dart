import 'dart:developer';
// Lưu ý: Cần thêm package 'signalr_netcore' vào pubspec.yaml
// import 'package:signalr_netcore/signalr_client.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SignalRService {
  static const String hubUrl = 'http://10.0.2.2:5000/hubs/order';
  // HubConnection? _hubConnection;

  Future<void> initConnection() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');

    if (token == null) return;

    /* Mã giả lập cấu hình SignalR
    _hubConnection = HubConnectionBuilder()
        .withUrl(
          hubUrl,
          options: HttpConnectionOptions(
            accessTokenFactory: () async => token,
          ),
        )
        .withAutomaticReconnect()
        .build();

    _hubConnection?.on('ReceiveOrderUpdate', _handleOrderUpdate);
    _hubConnection?.on('ReceiveNotification', _handleNotification);

    try {
      await _hubConnection?.start();
      log('SignalR Connected');
    } catch (e) {
      log('SignalR Connection Error: $e');
    }
    */
    log('SignalR Service Initialized (Placeholder)');
  }

  void _handleOrderUpdate(List<Object?>? parameters) {
    if (parameters != null && parameters.isNotEmpty) {
      log('Order Update: ${parameters.first}');
      // Bắn sự kiện ra UI (qua Stream hoặc Riverpod)
    }
  }

  void _handleNotification(List<Object?>? parameters) {
    if (parameters != null && parameters.isNotEmpty) {
      log('Notification: ${parameters.first}');
    }
  }

  Future<void> stopConnection() async {
    // await _hubConnection?.stop();
  }
}

final signalRService = SignalRService();
