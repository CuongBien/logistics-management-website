import 'dart:developer';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/error/app_exception.dart';
import '../data/auth_repository.dart';
import '../domain/auth_models.dart';
import '../../../core/constants/app_config.dart';
import '../../wms/notification/providers/notification_providers.dart';

// ============================================================================
// Auth State - sealed class hierarchy cho các trạng thái xác thực
// ============================================================================

/// Sealed class đại diện cho tất cả trạng thái xác thực có thể có
sealed class AuthState {
  const AuthState();
}

/// Trạng thái khởi tạo ban đầu - chưa kiểm tra token
class AuthInitial extends AuthState {
  const AuthInitial();
}

/// Đang thực hiện xác thực (đăng nhập, kiểm tra token, refresh)
class AuthLoading extends AuthState {
  const AuthLoading();
}

/// Đã xác thực thành công - có thông tin người dùng
class AuthAuthenticated extends AuthState {
  final UserProfile user;
  const AuthAuthenticated(this.user);
}

/// Chưa xác thực hoặc đã đăng xuất
class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

/// Xác thực thất bại - có thông báo lỗi
class AuthError extends AuthState {
  final String message;
  const AuthError(this.message);
}

// ============================================================================
// Auth Notifier - quản lý logic xác thực
// ============================================================================

/// AuthNotifier quản lý toàn bộ logic xác thực.
/// Kế thừa Notifier<AuthState> theo chuẩn Riverpod v3.0.
class AuthNotifier extends Notifier<AuthState> {
  late final AuthRepository _authRepo;

  /// Dio instance riêng cho các request xác thực (không cần interceptor token)
  final Dio _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 15),
  ));

  @override
  AuthState build() {
    _authRepo = AuthRepository(Dio());
    return const AuthInitial();
  }

  /// Kiểm tra trạng thái xác thực hiện tại.
  /// Đọc token từ SharedPreferences, parse UserProfile từ JWT nếu có.
  Future<void> checkAuthStatus() async {
    state = const AuthLoading();

    try {
      final prefs = await SharedPreferences.getInstance();
      final accessToken = prefs.getString('access_token');

      if (accessToken == null || accessToken.isEmpty) {
        state = const AuthUnauthenticated();
        return;
      }

      // Parse token để lấy thông tin user và kiểm tra hết hạn
      final tokenResponse = TokenResponse(
        accessToken: accessToken,
        refreshToken: prefs.getString('refresh_token') ?? '',
        expiresIn: 0,
        tokenType: 'Bearer',
      );

      if (tokenResponse.isExpired) {
        // Token hết hạn → thử refresh
        final refreshToken = prefs.getString('refresh_token');
        if (refreshToken != null && refreshToken.isNotEmpty) {
          await _refreshToken(refreshToken);
        } else {
          state = const AuthUnauthenticated();
        }
        return;
      }

      // Token còn hạn → parse user profile
      final user = UserProfile.fromJwt(accessToken);
      state = AuthAuthenticated(user);
      log('Auth: Đã khôi phục phiên đăng nhập cho ${user.username}');
      Future.microtask(() async {
        ref.read(notificationServiceProvider).startConnection();
        final currentContext = ref.read(warehouseContextProvider);
        if (currentContext == null && user.warehouseId != null && user.warehouseId!.isNotEmpty) {
          ref.read(warehouseContextProvider.notifier).setWarehouse(
            WarehouseContext(
              warehouseId: user.warehouseId!,
              warehouseName: user.warehouseName ?? 'Kho mặc định',
            ),
          );
        } else if (currentContext == null) {
          // JWT không có warehouse_id → tự động lấy kho đầu tiên từ API
          await _autoSelectFirstWarehouse(accessToken);
        }
      });
    } catch (e) {
      log('Auth: Lỗi kiểm tra trạng thái - $e');
      state = const AuthUnauthenticated();
    }
  }

  /// Đăng nhập bằng username và password qua Keycloak Direct Access Grant.
  Future<void> login(String username, String password) async {
    if (username.trim().isEmpty || password.trim().isEmpty) {
      state = const AuthError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    state = const AuthLoading();

    try {
      final config = ref.read(appConfigProvider);
      final tokenEndpoint = '${config.keycloakRealmUrl}/protocol/openid-connect/token';
      
      final response = await _dio.post(
        tokenEndpoint,
        data: {
          'client_id': config.keycloakClientId,
          'client_secret': 'my-secret',
          'grant_type': 'password',
          'username': username.trim(),
          'password': password,
        },
        options: Options(
          contentType: Headers.formUrlEncodedContentType,
        ),
      );

      if (response.statusCode == 200) {
        final tokenResponse = TokenResponse.fromJson(
          response.data as Map<String, dynamic>,
        );

        // Lưu tokens vào SharedPreferences
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('access_token', tokenResponse.accessToken);
        await prefs.setString('refresh_token', tokenResponse.refreshToken);

        // Parse thông tin user từ JWT
        final user = UserProfile.fromJwt(tokenResponse.accessToken);
        state = AuthAuthenticated(user);
        log('Auth: Đăng nhập thành công - ${user.username} (${user.appRole.name})');
        Future.microtask(() async {
          ref.read(notificationServiceProvider).startConnection();
          if (user.warehouseId != null && user.warehouseId!.isNotEmpty) {
            ref.read(warehouseContextProvider.notifier).setWarehouse(
              WarehouseContext(
                warehouseId: user.warehouseId!,
                warehouseName: user.warehouseName ?? 'Kho mặc định',
              ),
            );
          } else {
            // JWT không có warehouse_id → tự động lấy kho đầu tiên từ API
            await _autoSelectFirstWarehouse(tokenResponse.accessToken);
          }
        });
      } else {
        state = const AuthError('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } on DioException catch (e) {
      final appException = AppException.fromDioException(e);

      // Keycloak trả về 401 khi sai mật khẩu
      if (e.response?.statusCode == 401) {
        state = const AuthError('Tên đăng nhập hoặc mật khẩu không đúng');
      } else if (appException is NetworkException) {
        state = AuthError(appException.message);
      } else {
        state = const AuthError('Đăng nhập thất bại. Vui lòng thử lại.');
      }
      log('Auth: Đăng nhập thất bại - $e');
    } catch (e) {
      state = AuthError('Lỗi không mong muốn: ${e.toString()}');
      log('Auth: Lỗi không mong muốn - $e');
    }
  }

  /// Đăng xuất - xóa tokens và reset trạng thái
  Future<void> logout() async {
    try {
      await _authRepo.logout();
    } catch (e) {
      log('Auth: Lỗi khi đăng xuất - $e');
    }
    Future.microtask(() {
      ref.read(notificationServiceProvider).stopConnection();
      ref.read(warehouseContextProvider.notifier).clear();
    });
    state = const AuthUnauthenticated();
    log('Auth: Đã đăng xuất');
  }

  /// Refresh token bằng Keycloak refresh_token grant
  Future<void> refreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    final refreshTokenValue = prefs.getString('refresh_token');

    if (refreshTokenValue == null || refreshTokenValue.isEmpty) {
      state = const AuthUnauthenticated();
      return;
    }

    await _refreshToken(refreshTokenValue);
  }

  /// Logic refresh token nội bộ
  Future<void> _refreshToken(String refreshTokenValue) async {
    try {
      final config = ref.read(appConfigProvider);
      final tokenEndpoint = '${config.keycloakRealmUrl}/protocol/openid-connect/token';
      
      final response = await _dio.post(
        tokenEndpoint,
        data: {
          'client_id': config.keycloakClientId,
          'client_secret': 'my-secret',
          'grant_type': 'refresh_token',
          'refresh_token': refreshTokenValue,
        },
        options: Options(
          contentType: Headers.formUrlEncodedContentType,
        ),
      );

      if (response.statusCode == 200) {
        final tokenResponse = TokenResponse.fromJson(
          response.data as Map<String, dynamic>,
        );

        // Cập nhật tokens mới
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('access_token', tokenResponse.accessToken);
        await prefs.setString('refresh_token', tokenResponse.refreshToken);

        final user = UserProfile.fromJwt(tokenResponse.accessToken);
        state = AuthAuthenticated(user);
        log('Auth: Refresh token thành công - ${user.username}');
        Future.microtask(() async {
          ref.read(notificationServiceProvider).startConnection();
          final currentContext = ref.read(warehouseContextProvider);
          if (currentContext == null && user.warehouseId != null && user.warehouseId!.isNotEmpty) {
            ref.read(warehouseContextProvider.notifier).setWarehouse(
              WarehouseContext(
                warehouseId: user.warehouseId!,
                warehouseName: user.warehouseName ?? 'Kho mặc định',
              ),
            );
          } else if (currentContext == null) {
            await _autoSelectFirstWarehouse(tokenResponse.accessToken);
          }
        });
      } else {
        state = const AuthUnauthenticated();
      }
    } catch (e) {
      log('Auth: Refresh token thất bại - $e');
      state = const AuthUnauthenticated();
    }
  }

  /// Tự động lấy kho đầu tiên từ API khi JWT không có warehouse_id
  Future<void> _autoSelectFirstWarehouse(String accessToken) async {
    try {
      final config = ref.read(appConfigProvider);
      final warehouseDio = Dio(BaseOptions(
        baseUrl: config.apiBaseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
      ));
      final response = await warehouseDio.get(
        '/warehouse',
        queryParameters: {'all': true},
        options: Options(
          headers: {'Authorization': 'Bearer $accessToken'},
        ),
      );
      if (response.statusCode == 200 && response.data is List && (response.data as List).isNotEmpty) {
        final firstWarehouse = response.data[0];
        final whId = firstWarehouse['id']?.toString() ?? firstWarehouse['warehouseId']?.toString() ?? '';
        final whName = firstWarehouse['name']?.toString() ?? firstWarehouse['warehouseName']?.toString() ?? 'Kho mặc định';
        if (whId.isNotEmpty) {
          ref.read(warehouseContextProvider.notifier).setWarehouse(
            WarehouseContext(
              warehouseId: whId,
              warehouseName: whName,
            ),
          );
          log('Auth: Tự động chọn kho "$whName" ($whId)');
        }
      }
    } catch (e) {
      log('Auth: Không thể tự động chọn kho - $e');
    }
  }

  /// Lấy thông tin user hiện tại (nếu đã đăng nhập)
  UserProfile? get currentUser {
    final currentState = state;
    if (currentState is AuthAuthenticated) {
      return currentState.user;
    }
    return null;
  }
}

// ============================================================================
// Riverpod Providers
// ============================================================================

/// Provider chính quản lý trạng thái xác thực (NotifierProvider v3.0)
final authProvider = NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);

/// Provider tiện ích lấy thông tin user hiện tại (null nếu chưa đăng nhập)
final currentUserProvider = Provider<UserProfile?>((ref) {
  final authState = ref.watch(authProvider);
  if (authState is AuthAuthenticated) {
    return authState.user;
  }
  return null;
});

/// Provider tiện ích kiểm tra trạng thái đăng nhập
final isAuthenticatedProvider = Provider<bool>((ref) {
  final authState = ref.watch(authProvider);
  return authState is AuthAuthenticated;
});
