import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Đại diện cho một hành động API đang chờ xử lý khi offline.
class OfflineAction {
  /// ID duy nhất (UUID)
  final String id;

  /// Loại hành động (ví dụ: 'scan-receive', 'confirm-pick', 'verify-pack')
  final String actionType;

  /// Đường dẫn API (ví dụ: '/api/inbound/receive')
  final String endpoint;

  /// Phương thức HTTP (POST, PUT)
  final String method;

  /// Body request dạng JSON
  final Map<String, dynamic> body;

  /// Thời điểm tạo hành động
  final DateTime createdAt;

  /// Số lần đã thử gửi lại
  final int retryCount;

  OfflineAction({
    required this.id,
    required this.actionType,
    required this.endpoint,
    required this.method,
    required this.body,
    required this.createdAt,
    this.retryCount = 0,
  });

  /// Tạo bản sao với số lần retry tăng thêm
  OfflineAction copyWithRetry() {
    return OfflineAction(
      id: id,
      actionType: actionType,
      endpoint: endpoint,
      method: method,
      body: body,
      createdAt: createdAt,
      retryCount: retryCount + 1,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'actionType': actionType,
      'endpoint': endpoint,
      'method': method,
      'body': body,
      'createdAt': createdAt.toIso8601String(),
      'retryCount': retryCount,
    };
  }

  factory OfflineAction.fromJson(Map<String, dynamic> json) {
    return OfflineAction(
      id: json['id'] as String,
      actionType: json['actionType'] as String,
      endpoint: json['endpoint'] as String,
      method: json['method'] as String,
      body: Map<String, dynamic>.from(json['body'] as Map),
      createdAt: DateTime.parse(json['createdAt'] as String),
      retryCount: json['retryCount'] as int? ?? 0,
    );
  }
}

/// Kết quả đồng bộ hàng loạt các hành động offline
class SyncResult {
  /// Tổng số hành động đã xử lý
  final int total;

  /// Số hành động thành công
  final int succeeded;

  /// Số hành động thất bại
  final int failed;

  /// Danh sách lỗi chi tiết
  final List<String> errors;

  const SyncResult({
    required this.total,
    required this.succeeded,
    required this.failed,
    required this.errors,
  });
}

/// Hàng đợi lưu trữ và xử lý các hành động API khi offline.
/// Dữ liệu được persist qua SharedPreferences để không bị mất khi tắt app.
class OfflineQueue {
  static const String _storageKey = 'offline_queue';
  List<OfflineAction> _queue = [];

  /// Tải hàng đợi từ SharedPreferences
  Future<void> load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonString = prefs.getString(_storageKey);
      if (jsonString != null && jsonString.isNotEmpty) {
        final List<dynamic> jsonList = jsonDecode(jsonString) as List<dynamic>;
        _queue = jsonList
            .map((item) =>
                OfflineAction.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {
      // Nếu lỗi parse, reset hàng đợi
      _queue = [];
    }
  }

  /// Lưu hàng đợi vào SharedPreferences
  Future<void> _save() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonString =
        jsonEncode(_queue.map((action) => action.toJson()).toList());
    await prefs.setString(_storageKey, jsonString);
  }

  /// Thêm hành động vào hàng đợi
  Future<void> enqueue(OfflineAction action) async {
    _queue.add(action);
    await _save();
  }

  /// Xóa hành động khỏi hàng đợi theo ID
  Future<void> dequeue(String actionId) async {
    _queue.removeWhere((action) => action.id == actionId);
    await _save();
  }

  /// Danh sách các hành động đang chờ xử lý (không thể chỉnh sửa)
  List<OfflineAction> get pendingActions => List.unmodifiable(_queue);

  /// Số lượng hành động đang chờ
  int get pendingCount => _queue.length;

  /// Đồng bộ tất cả hành động đang chờ lên server.
  /// Gọi khi thiết bị trở lại online.
  ///
  /// [dio]: Instance Dio để gửi request
  /// [baseUrl]: URL gốc của API server
  Future<SyncResult> syncAll(Dio dio, String baseUrl) async {
    final total = _queue.length;
    int succeeded = 0;
    int failed = 0;
    final List<String> errors = [];
    final List<OfflineAction> remaining = [];

    for (final action in _queue) {
      try {
        final url = '$baseUrl${action.endpoint}';
        Response response;

        // Gửi request theo phương thức HTTP tương ứng
        switch (action.method.toUpperCase()) {
          case 'POST':
            response = await dio.post(url, data: action.body);
            break;
          case 'PUT':
            response = await dio.put(url, data: action.body);
            break;
          default:
            throw Exception('Phương thức không hỗ trợ: ${action.method}');
        }

        if (response.statusCode != null &&
            response.statusCode! >= 200 &&
            response.statusCode! < 300) {
          succeeded++;
        } else {
          failed++;
          remaining.add(action.copyWithRetry());
          errors.add(
              '[${action.actionType}] HTTP ${response.statusCode}: ${action.endpoint}');
        }
      } catch (e) {
        failed++;
        remaining.add(action.copyWithRetry());
        errors.add(
            '[${action.actionType}] ${e.toString().replaceAll('Exception: ', '')}: ${action.endpoint}');
      }
    }

    // Cập nhật hàng đợi chỉ giữ lại các action thất bại
    _queue = remaining;
    await _save();

    return SyncResult(
      total: total,
      succeeded: succeeded,
      failed: failed,
      errors: errors,
    );
  }
}

/// Provider cung cấp OfflineQueue singleton
final offlineQueueProvider = Provider<OfflineQueue>((ref) => OfflineQueue());

class PendingCountNotifier extends Notifier<int> {
  @override
  int build() => 0;

  void set(int count) {
    state = count;
  }
}

/// Provider theo dõi số lượng hành động đang chờ đồng bộ
final pendingCountProvider = NotifierProvider<PendingCountNotifier, int>(
  PendingCountNotifier.new,
);
