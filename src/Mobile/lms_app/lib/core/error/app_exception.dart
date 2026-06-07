import 'package:dio/dio.dart';

/// Base exception class cho toàn bộ ứng dụng LMS.
/// Tất cả các exception cụ thể đều kế thừa từ class này.
class AppException implements Exception {
  final String message;
  final String? code;
  final int? statusCode;

  const AppException(
    this.message, {
    this.code,
    this.statusCode,
  });

  /// Factory constructor chuyển đổi DioException thành AppException tương ứng.
  /// Map các loại lỗi mạng, xác thực, và QR code cụ thể.
  factory AppException.fromDioException(DioException e) {
    // Lỗi timeout kết nối
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.sendTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return const NetworkException('Kết nối quá thời gian');
    }

    // Lỗi không thể kết nối tới server
    if (e.type == DioExceptionType.connectionError) {
      return const NetworkException('Không thể kết nối tới server');
    }

    // Xử lý lỗi từ response của server
    final response = e.response;
    if (response != null) {
      final statusCode = response.statusCode;

      // 401 - Phiên đăng nhập hết hạn
      if (statusCode == 401) {
        return const AuthException(
          'Phiên đăng nhập đã hết hạn',
          code: 'Auth.Unauthorized',
          statusCode: 401,
        );
      }

      // 403 - Không có quyền truy cập
      if (statusCode == 403) {
        return const AuthException(
          'Không có quyền truy cập',
          code: 'Operator.Forbidden',
          statusCode: 403,
        );
      }

      // Xử lý body lỗi có cấu trúc {isSuccess: false, error: {code, message}}
      final data = response.data;
      if (data is Map<String, dynamic>) {
        final isSuccess = data['isSuccess'] as bool? ?? true;
        if (!isSuccess) {
          final error = data['error'] as Map<String, dynamic>?;
          if (error != null) {
            final errorCode = error['code'] as String? ?? '';
            final errorMessage = error['message'] as String? ?? 'Đã có lỗi xảy ra';

            // Map các mã lỗi QR code cụ thể
            if (_isQrErrorCode(errorCode)) {
              return QrException(
                errorMessage,
                code: errorCode,
                statusCode: statusCode,
              );
            }

            return AppException(
              errorMessage,
              code: errorCode,
              statusCode: statusCode,
            );
          }
        }
      }

      // Response lỗi không có body chuẩn
      return AppException(
        'Lỗi server: ${statusCode ?? 'không xác định'}',
        statusCode: statusCode,
      );
    }

    // Lỗi hủy request
    if (e.type == DioExceptionType.cancel) {
      return const NetworkException('Yêu cầu đã bị hủy');
    }

    // Lỗi không xác định
    return AppException('Đã có lỗi xảy ra: ${e.message ?? 'Không rõ nguyên nhân'}');
  }

  /// Kiểm tra mã lỗi có phải lỗi QR code không
  static bool _isQrErrorCode(String code) {
    const qrErrorCodes = {
      'QR.InvalidFormat',
      'QR.EntityNotFound',
      'QR.BinMismatch',
      'QR.SkuMismatch',
      'QR.InvalidState',
      'QR.DuplicateScan',
      'QR.QuantityExceeded',
    };
    return qrErrorCodes.contains(code);
  }

  @override
  String toString() => 'AppException($code): $message';
}

/// Exception cho các lỗi liên quan đến kết nối mạng
class NetworkException extends AppException {
  const NetworkException(
    super.message, {
    super.code,
    super.statusCode,
  });

  @override
  String toString() => 'NetworkException($code): $message';
}

/// Exception cho các lỗi liên quan đến xác thực và phân quyền
class AuthException extends AppException {
  const AuthException(
    super.message, {
    super.code,
    super.statusCode,
  });

  @override
  String toString() => 'AuthException($code): $message';
}

/// Exception cho các lỗi liên quan đến quét mã QR trong kho
class QrException extends AppException {
  const QrException(
    super.message, {
    super.code,
    super.statusCode,
  });

  /// Lấy thông báo lỗi thân thiện dựa trên mã lỗi QR
  String get friendlyMessage {
    switch (code) {
      case 'QR.InvalidFormat':
        return 'Mã QR không hợp lệ';
      case 'QR.EntityNotFound':
        return 'Không tìm thấy đối tượng từ mã QR';
      case 'QR.BinMismatch':
        return 'Vị trí bin không khớp';
      case 'QR.SkuMismatch':
        return 'Mã SKU không khớp';
      case 'QR.InvalidState':
        return 'Trạng thái không hợp lệ để thực hiện thao tác';
      case 'QR.DuplicateScan':
        return 'Mã QR đã được quét trước đó';
      case 'QR.QuantityExceeded':
        return 'Số lượng vượt quá giới hạn cho phép';
      default:
        return message;
    }
  }

  @override
  String toString() => 'QrException($code): $message';
}

/// Exception cho các lỗi validate dữ liệu đầu vào
class ValidationException extends AppException {
  const ValidationException(
    super.message, {
    super.code,
    super.statusCode,
  });

  @override
  String toString() => 'ValidationException($code): $message';
}
