import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Cấu hình môi trường cho ứng dụng LMS
class AppConfig {
  final String apiBaseUrl;
  final String keycloakBaseUrl;
  final String keycloakRealm;
  final String keycloakClientId;
  final String signalRUrl;
  final bool enableOfflineMode;

  const AppConfig({
    required this.apiBaseUrl,
    required this.keycloakBaseUrl,
    required this.keycloakRealm,
    required this.keycloakClientId,
    required this.signalRUrl,
    this.enableOfflineMode = false,
  });

  /// Cấu hình cho Android emulator và điện thoại thật qua mạng LAN
  factory AppConfig.dev() {
    return const AppConfig(
      apiBaseUrl: 'http://192.168.1.6:5051/api',
      keycloakBaseUrl: 'http://192.168.1.6:18080',
      keycloakRealm: 'logistics_realm',
      keycloakClientId: 'oms-client',
      signalRUrl: 'http://192.168.1.6:5051/hubs',
      enableOfflineMode: false,
    );
  }

  /// Cấu hình cho chạy trực tiếp trên Windows (localhost)
  factory AppConfig.localWindows() {
    return const AppConfig(
      apiBaseUrl: 'http://127.0.0.1:5051/api',
      keycloakBaseUrl: 'http://127.0.0.1:8080',
      keycloakRealm: 'logistics_realm',
      keycloakClientId: 'oms-client',
      signalRUrl: 'http://127.0.0.1:5051/hubs',
      enableOfflineMode: false,
    );
  }

  /// Cấu hình cho môi trường staging (placeholder)
  factory AppConfig.staging() {
    return const AppConfig(
      apiBaseUrl: 'https://staging-api.lms.example.com/api',
      keycloakBaseUrl: 'https://staging-auth.lms.example.com',
      keycloakRealm: 'logistics_realm',
      keycloakClientId: 'oms-client',
      signalRUrl: 'https://staging-api.lms.example.com/hubs',
      enableOfflineMode: false,
    );
  }

  /// Cấu hình cho môi trường production (placeholder)
  factory AppConfig.prod() {
    return const AppConfig(
      apiBaseUrl: 'https://api.lms.example.com/api',
      keycloakBaseUrl: 'https://auth.lms.example.com',
      keycloakRealm: 'logistics_realm',
      keycloakClientId: 'oms-client',
      signalRUrl: 'https://api.lms.example.com/hubs',
      enableOfflineMode: true,
    );
  }

  /// URL đầy đủ tới Keycloak realm
  String get keycloakRealmUrl => '$keycloakBaseUrl/realms/$keycloakRealm';
}

/// Provider cung cấp cấu hình môi trường cho toàn bộ ứng dụng
final appConfigProvider = Provider<AppConfig>((ref) => AppConfig.dev());

/// Lưu trữ thông tin kho (warehouse) đang được chọn bởi người dùng.
/// Warehouse được gán cho user thông qua thuộc tính warehouseId trong Keycloak.
class WarehouseContext {
  final String warehouseId;
  final String warehouseName;

  const WarehouseContext({
    required this.warehouseId,
    required this.warehouseName,
  });

  /// Khởi tạo WarehouseContext từ thông tin UserProfile
  /// (UserProfile chứa warehouseId được admin cấu hình trong Keycloak)
  factory WarehouseContext.fromUserProfile(Map<String, dynamic> profile) {
    return WarehouseContext(
      warehouseId: profile['warehouseId'] as String? ?? '',
      warehouseName: profile['warehouseName'] as String? ?? '',
    );
  }

  /// Đọc thông tin warehouse đã lưu từ SharedPreferences
  static Future<WarehouseContext?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final warehouseId = prefs.getString(_keyWarehouseId);
    final warehouseName = prefs.getString(_keyWarehouseName);

    if (warehouseId == null || warehouseId.isEmpty) {
      return null;
    }

    return WarehouseContext(
      warehouseId: warehouseId,
      warehouseName: warehouseName ?? '',
    );
  }

  /// Lưu thông tin warehouse vào SharedPreferences để sử dụng offline
  Future<void> save() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyWarehouseId, warehouseId);
    await prefs.setString(_keyWarehouseName, warehouseName);
  }

  /// Xóa thông tin warehouse đã lưu (khi đăng xuất)
  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyWarehouseId);
    await prefs.remove(_keyWarehouseName);
  }

  static const String _keyWarehouseId = 'warehouse_id';
  static const String _keyWarehouseName = 'warehouse_name';

  @override
  String toString() => 'WarehouseContext($warehouseId, $warehouseName)';
}

class WarehouseContextNotifier extends Notifier<WarehouseContext?> {
  @override
  WarehouseContext? build() => null;

  void setWarehouse(WarehouseContext? context) {
    state = context;
  }
}

/// Provider quản lý trạng thái warehouse đang được chọn.
/// Null khi chưa đăng nhập hoặc chưa chọn kho.
final warehouseContextProvider = NotifierProvider<WarehouseContextNotifier, WarehouseContext?>(
  WarehouseContextNotifier.new,
);

