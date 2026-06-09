import 'dart:convert';

import '../../../core/utils/role_manager.dart';

/// Model chứa thông tin token nhận từ Keycloak token endpoint.
class TokenResponse {
  final String accessToken;
  final String refreshToken;
  final int expiresIn;
  final String tokenType;

  const TokenResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresIn,
    required this.tokenType,
  });

  /// Parse từ JSON response của Keycloak
  factory TokenResponse.fromJson(Map<String, dynamic> json) {
    return TokenResponse(
      accessToken: json['access_token'] as String? ?? '',
      refreshToken: json['refresh_token'] as String? ?? '',
      expiresIn: json['expires_in'] as int? ?? 0,
      tokenType: json['token_type'] as String? ?? 'Bearer',
    );
  }

  /// Kiểm tra token đã hết hạn chưa bằng cách parse claim `exp` từ JWT.
  /// Trả về true nếu token đã hết hạn hoặc không parse được.
  bool get isExpired {
    try {
      final parts = accessToken.split('.');
      if (parts.length != 3) return true;

      final payload = utf8.decode(
        base64Url.decode(base64Url.normalize(parts[1])),
      );
      final payloadMap = json.decode(payload) as Map<String, dynamic>;
      final exp = payloadMap['exp'] as int?;

      if (exp == null) return true;

      // So sánh thời gian hết hạn với thời gian hiện tại (có buffer 30 giây)
      final expiryDate = DateTime.fromMillisecondsSinceEpoch(exp * 1000);
      return DateTime.now().isAfter(expiryDate.subtract(const Duration(seconds: 30)));
    } catch (_) {
      return true;
    }
  }

  @override
  String toString() => 'TokenResponse(tokenType: $tokenType, expiresIn: $expiresIn)';
}

/// Model chứa thông tin người dùng được parse từ JWT access token.
/// Bao gồm các custom claim của Keycloak: tenant_id, warehouse_id, roles.
class UserProfile {
  final String id;             // sub từ JWT
  final String username;       // preferred_username từ JWT
  final String? email;
  final String tenantId;       // tenant_id custom claim
  final String? warehouseId;   // warehouse_id custom claim (do admin gán)
  final String? warehouseName; // warehouse_name custom claim
  final List<String> roles;    // từ realm_access.roles
  final String? fullName;      // từ name
  final String? employeeCode;  // từ employee_code
  final String? phone;         // từ phone

  const UserProfile({
    required this.id,
    required this.username,
    this.email,
    required this.tenantId,
    this.warehouseId,
    this.warehouseName,
    required this.roles,
    this.fullName,
    this.employeeCode,
    this.phone,
  });

  /// Parse thông tin người dùng từ JWT access token.
  /// Giải mã phần payload (base64) và trích xuất các claim.
  factory UserProfile.fromJwt(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) {
        throw const FormatException('JWT không hợp lệ: phải có 3 phần');
      }

      final payload = utf8.decode(
        base64Url.decode(base64Url.normalize(parts[1])),
      );
      final payloadMap = json.decode(payload) as Map<String, dynamic>;

      // Trích xuất roles từ realm_access
      final realmAccess = payloadMap['realm_access'] as Map<String, dynamic>?;
      final rolesList = (realmAccess?['roles'] as List<dynamic>?)
              ?.map((r) => r.toString())
              .toList() ??
          [];

      return UserProfile(
        id: payloadMap['sub'] as String? ?? '',
        username: payloadMap['preferred_username'] as String? ?? '',
        email: payloadMap['email'] as String?,
        tenantId: payloadMap['tenant_id'] as String? ?? 'default-tenant',
        warehouseId: payloadMap['warehouse_id'] as String?,
        warehouseName: payloadMap['warehouse_name'] as String?,
        roles: rolesList,
        fullName: payloadMap['name'] as String?,
        employeeCode: payloadMap['employee_code'] as String?,
        phone: payloadMap['phone'] as String?,
      );
    } catch (e) {
      if (e is FormatException) rethrow;
      throw FormatException('Không thể parse JWT: $e');
    }
  }

  /// Kiểm tra người dùng có role quản lý (manager) không
  bool get isManager => roles.contains('manager');

  /// Kiểm tra người dùng có role nhân viên vận hành (operator) không
  bool get isOperator => roles.contains('operator');

  /// Lấy AppRole tương ứng, ưu tiên manager > operator > unknown
  AppRole get appRole {
    if (isManager) return AppRole.manager;
    if (isOperator) return AppRole.operator;
    return AppRole.unknown;
  }

  @override
  String toString() => 'UserProfile(id: $id, username: $username, roles: $roles)';
}
