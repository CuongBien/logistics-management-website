import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

enum AppRole { manager, operator, unknown }

class RoleManager {
  static Future<AppRole> getCurrentRole() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    
    if (token == null) return AppRole.unknown;

    try {
      // Decode phần Payload của JWT (nằm ở vị trí index 1 sau dấu '.')
      final parts = token.split('.');
      if (parts.length != 3) return AppRole.unknown;

      final payload = utf8.decode(base64Url.decode(base64Url.normalize(parts[1])));
      final payloadMap = json.decode(payload);

      // Map roles từ realm_access.roles của Keycloak
      final realmAccess = payloadMap['realm_access'] as Map<String, dynamic>?;
      final roles = realmAccess?['roles'] as List<dynamic>? ?? [];

      if (roles.contains('manager')) {
        return AppRole.manager;
      } else if (roles.contains('operator')) {
        return AppRole.operator;
      }
      return AppRole.unknown;
    } catch (e) {
      return AppRole.unknown;
    }
  }

  static bool hasAccessToWms(AppRole role) {
    return role == AppRole.manager || role == AppRole.operator;
  }

  static bool hasAccessToOms(AppRole role) {
    return role == AppRole.manager; // Chỉ quản lý mới được xem OMS
  }
}
