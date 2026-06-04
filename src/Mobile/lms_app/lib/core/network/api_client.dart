import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static const String baseUrl = 'http://192.168.88.214:5051/api'; // Đổi sang IP LAN của host máy tính chạy API
  // Token cứng dùng tạm để gọi API mà không cần màn hình Đăng nhập (sẽ thay bằng token thật sau)
  static const String hardcodedToken = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICIwZzMzTUNORy1EUWNnZzE5X0NibmdTUklfNmI0RDlJZkRWam1xbjVDa0JNIn0.eyJleHAiOjE3ODAwODY2ODgsImlhdCI6MTc4MDA4NjM4OCwianRpIjoiNzQ0YzQ0ZDQtODU3MC00ZTE4LWJkNWYtYTEwM2VhZmRkYmMxIiwiaXNzIjoiaHR0cDovLzEyNy4wLjAuMToxODA4MC9yZWFsbXMvbG9naXN0aWNzX3JlYWxtIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjlmNGJhNmRkLWY0ODktNDMwMi04MWU0LTQxZDFiMWEwYWRkZSIsInR5cCI6IkJlYXJlciIsImF6cCI6Im9tcy1jbGllbnQiLCJzZXNzaW9uX3N0YXRlIjoiNzZjMTI1MGItNjdlMi00MTY3LWI3YzYtNzMzNzAzNjVjODFlIiwiYWNyIjoiMSIsInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJvZmZsaW5lX2FjY2VzcyIsImRlZmF1bHQtcm9sZXMtbG9naXN0aWNzX3JlYWxtIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6ImVtYWlsIHByb2ZpbGUiLCJzaWQiOiI3NmMxMjUwYi02N2UyLTQxNjctYjdjNi03MzM3MDM2NWM4MWUiLCJ0ZW5hbnRfaWQiOiJkZWZhdWx0LXRlbmFudCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwicHJlZmVycmVkX3VzZXJuYW1lIjoiYWRtaW5fdXNlciJ9.Yhg7MIXiLptJnCH2tP3Fea1amIuAPVBnLiWPYXI0LdDojbsrj_652F3mvPMA4PeTH2rSjJOc-FGf82wqzlu1zn3H8NdnM1px8jLH83Vzmhn96M_ibpGVE6ix288j-20hX1p1ngchp2FOfLnGC-JWWcsRGMB1vWn0Ex5hAGgKqOlrofzfBLQ_cFQDMmu_J_qPUdJg8axXGzrtJWc-GLv6wecZM-ZptumR1spoTiAWiczMPgFN4jNgLhQv9x9pF32Pqg7mA4VO76lwTMmBHlPj4XQWf6rMV0hhYvj5uX2XR_1ZFO1xqcH47OzEDNbpMCrUUR10LkcB5USpkIT-8ELRcw';
  late final Dio dio;

  ApiClient() {
    dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    // Thêm Interceptor để tự động đính kèm Token vào mỗi request
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Ưu tiên token trong SharedPreferences, nếu chưa có thì dùng Hardcoded Token
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('access_token') ?? hardcodedToken;
        
        options.headers['Authorization'] = 'Bearer $token';
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        // Có thể xử lý refresh token tại đây nếu mã lỗi là 401
        return handler.next(e);
      },
    ));
  }
}

// Provider để sử dụng ApiClient toàn cục (sẽ dùng chung với Riverpod)
final apiClient = ApiClient();
