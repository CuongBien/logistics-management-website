import 'dart:developer';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthRepository {
  final Dio dio;

  AuthRepository(this.dio);

  /// Đăng nhập bằng tên đăng nhập và mật khẩu (Direct Access Grant của Keycloak)
  /// Trong thực tế, có thể sử dụng Authorization Code Flow qua trình duyệt với package flutter_appauth.
  Future<bool> login(String username, String password) async {
    try {
      // Endpoint giả lập của Keycloak
      const String tokenEndpoint = 'http://192.168.88.144:18080/realms/logistics_realm/protocol/openid-connect/token';
      
      final response = await dio.post(
        tokenEndpoint,
        data: {
          'client_id': 'oms-client',
          'client_secret': 'my-secret',
          'grant_type': 'password',
          'username': username,
          'password': password,
        },
        options: Options(
          contentType: Headers.formUrlEncodedContentType,
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data;
        final accessToken = data['access_token'];
        final refreshToken = data['refresh_token'];

        // Lưu token vào thiết bị
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('access_token', accessToken);
        await prefs.setString('refresh_token', refreshToken);
        
        log('Keycloak Login Success');
        return true;
      }
      return false;
    } catch (e) {
      log('Login failed: $e');
      return false;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('refresh_token');
    log('Logged out');
  }

  Future<bool> isAuthenticated() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    // Thực tế nên parse JWT để kiểm tra thời gian hết hạn (exp)
    return token != null && token.isNotEmpty;
  }
}
