import 'dart:async';
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Service giám sát trạng thái kết nối mạng.
/// Kiểm tra định kỳ bằng DNS lookup để xác định online/offline.
class ConnectivityService {
  final _controller = StreamController<bool>.broadcast();
  bool _isOnline = true;
  Timer? _timer;

  /// Stream thông báo thay đổi trạng thái kết nối
  Stream<bool> get onConnectivityChanged => _controller.stream;

  /// Trạng thái kết nối hiện tại
  bool get isOnline => _isOnline;

  /// Bắt đầu giám sát kết nối mỗi 15 giây
  void startMonitoring() {
    // Kiểm tra ngay lần đầu
    _checkConnectivity();
    _timer = Timer.periodic(const Duration(seconds: 15), (_) {
      _checkConnectivity();
    });
  }

  /// Dừng giám sát kết nối
  void stopMonitoring() {
    _timer?.cancel();
    _timer = null;
  }

  /// Kiểm tra kết nối bằng cách lookup DNS google.com (timeout 5s)
  Future<void> _checkConnectivity() async {
    try {
      final result = await InternetAddress.lookup('google.com')
          .timeout(const Duration(seconds: 5));
      _isOnline = result.isNotEmpty && result[0].rawAddress.isNotEmpty;
    } catch (_) {
      _isOnline = false;
    }
    if (!_controller.isClosed) {
      _controller.add(_isOnline);
    }
  }

  /// Giải phóng tài nguyên
  void dispose() {
    _timer?.cancel();
    _controller.close();
  }
}

/// Provider cung cấp ConnectivityService singleton.
/// Tự động bắt đầu giám sát khi khởi tạo và dọn dẹp khi dispose.
final connectivityServiceProvider = Provider<ConnectivityService>((ref) {
  final service = ConnectivityService();
  service.startMonitoring();
  ref.onDispose(() => service.dispose());
  return service;
});

/// Provider stream theo dõi thay đổi trạng thái online/offline.
final isOnlineProvider = StreamProvider<bool>((ref) {
  return ref.watch(connectivityServiceProvider).onConnectivityChanged;
});
