import 'dart:async';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

/// Helper chuyên dụng để lắng nghe dữ liệu từ máy quét mã vạch vật lý (PDA/Bluetooth).
/// Máy quét thường hoạt động như một bàn phím ảo, gõ chữ rất nhanh và kết thúc bằng phím Enter.
class ScannerHelper {
  final FocusNode focusNode = FocusNode();
  String _scannedCode = '';
  Timer? _timer;
  
  // Thời gian tối đa giữa 2 lần nhấn phím để tính là do máy quét
  static const int _scanTimeoutDuration = 100;

  final Function(String) onCodeScanned;

  ScannerHelper({required this.onCodeScanned});

  void handleKeyEvent(KeyEvent event) {
    if (event is KeyDownEvent) {
      // Nếu là phím Enter -> kết thúc mã
      if (event.logicalKey == LogicalKeyboardKey.enter) {
        if (_scannedCode.isNotEmpty) {
          onCodeScanned(_scannedCode);
          _scannedCode = '';
        }
        _timer?.cancel();
        return;
      }

      // Đọc ký tự từ phím
      if (event.character != null && event.character!.isNotEmpty) {
        _scannedCode += event.character!;
        
        // Reset timer, nếu sau 100ms không có phím nào được bấm thì tự động xóa (vì không phải máy quét)
        _timer?.cancel();
        _timer = Timer(const Duration(milliseconds: _scanTimeoutDuration), () {
          _scannedCode = '';
        });
      }
    }
  }
}
