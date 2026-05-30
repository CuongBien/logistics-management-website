import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/utils/scanner_helper.dart';
import '../../../../../core/constants/app_colors.dart';
import '../providers/outbound_provider.dart';

class PutToWallScreen extends ConsumerStatefulWidget {
  const PutToWallScreen({super.key});

  @override
  ConsumerState<PutToWallScreen> createState() => _PutToWallScreenState();
}

class _PutToWallScreenState extends ConsumerState<PutToWallScreen> {
  late final ScannerHelper _scannerHelper;
  final TextEditingController _waveIdController = TextEditingController();

  String _waveId = '';
  String _targetSlot = '';
  bool _isItemScanned = false;
  bool _isLoading = false;
  String _lastScannedSku = '';

  @override
  void initState() {
    super.initState();
    _scannerHelper = ScannerHelper(onCodeScanned: _handleScan);
  }

  void _loadWave(String waveId) {
    if (waveId.isEmpty) return;
    setState(() {
      _waveId = waveId;
      _waveIdController.text = waveId;
      _isItemScanned = false;
      _targetSlot = '';
    });
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text('✅ Đã chọn Wave ID: $waveId. Vui lòng quét sản phẩm.'),
      backgroundColor: AppColors.success,
    ));
  }

  void _handleScan(String code) async {
    if (_isLoading) return;

    if (_waveId.isEmpty) {
      // Nếu chưa có Wave ID, thử nhận dạng Wave ID hoặc quét Wave ID
      if (code.startsWith('WAVE-') || code.length >= 8) {
        _loadWave(code);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('⚠️ Vui lòng quét hoặc nhập mã Wave ID trước!'),
          backgroundColor: AppColors.warning,
        ));
      }
      return;
    }

    if (!_isItemScanned) {
      // Quét SKU -> Hệ thống gọi API chọc lấy ô đích
      setState(() {
        _isLoading = true;
        _lastScannedSku = code;
      });

      try {
        final repo = ref.read(outboundRepositoryProvider);
        final result = await repo.putToWall(_waveId, code);
        
        setState(() {
          _isItemScanned = true;
          _targetSlot = result['targetCubbyBinCode'] ?? 'UNKNOWN'; 
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('✅ Đã xác định ô chia chọn! Hãy bỏ hàng vào kệ.'),
          backgroundColor: AppColors.success,
        ));
      } catch (e) {
        setState(() {
          _isLoading = false;
          _lastScannedSku = '';
        });
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('❌ Lỗi chia chọn: ${e.toString().replaceAll('Exception: ', '')}'),
          backgroundColor: AppColors.error,
        ));
      }
    } else {
      // Đang chờ quét mã ô kệ đích để xác nhận cất thành công
      if (code == _targetSlot) {
        setState(() {
          _isItemScanned = false;
          _targetSlot = '';
          _lastScannedSku = '';
        });
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('✅ Xác nhận xếp ô thành công! Tiếp tục món tiếp theo.'),
          backgroundColor: AppColors.success,
        ));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('❌ Sai vị trí ô! Yêu cầu đặt vào ô: $_targetSlot'),
          backgroundColor: AppColors.error,
        ));
      }
    }
  }

  void _showManualInputDialog() {
    final TextEditingController controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Nhập mã thủ công'),
          content: TextField(
            controller: controller,
            decoration: const InputDecoration(
              hintText: 'Nhập mã Wave ID / SKU / Ô kệ...',
              border: OutlineInputBorder(),
            ),
            autofocus: true,
            onSubmitted: (value) {
              Navigator.pop(context);
              if (value.isNotEmpty) _handleScan(value.trim());
            },
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Hủy'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                if (controller.text.isNotEmpty) _handleScan(controller.text.trim());
              },
              child: const Text('Xác nhận'),
            ),
          ],
        );
      },
    );
  }

  @override
  void dispose() {
    _waveIdController.dispose();
    _scannerHelper.focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return KeyboardListener(
      focusNode: _scannerHelper.focusNode,
      onKeyEvent: _scannerHelper.handleKeyEvent,
      autofocus: true,
      child: Scaffold(
        appBar: AppBar(title: const Text('Chia chọn (Put-To-Wall)')),
        body: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Wave ID Input Card
              Card(
                elevation: 3,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _waveIdController,
                          decoration: const InputDecoration(
                            labelText: 'Quét / Nhập Wave ID',
                            prefixIcon: Icon(Icons.grid_view),
                            border: OutlineInputBorder(),
                          ),
                          onSubmitted: (value) {
                            if (value.isNotEmpty) _loadWave(value.trim());
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: () {
                          _loadWave(_waveIdController.text.trim());
                        },
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                        ),
                        child: const Icon(Icons.search),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Trạng thái cất hàng
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _waveId.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: const [
                                Icon(Icons.barcode_reader, size: 64, color: AppColors.textSecondary),
                                SizedBox(height: 8),
                                Text(
                                  'Chưa kết nối Wave ID.\nVui lòng nhập Wave ID để bắt đầu chia chọn.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: AppColors.textSecondary),
                                )
                              ],
                            ),
                          )
                        : Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              if (!_isItemScanned) ...[
                                Container(
                                  padding: const EdgeInsets.all(32),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withOpacity(0.08),
                                    borderRadius: BorderRadius.circular(100),
                                    border: Border.all(color: AppColors.primary, width: 2),
                                  ),
                                  child: const Icon(Icons.qr_code_scanner, size: 100, color: AppColors.primary),
                                ),
                                const SizedBox(height: 24),
                                const Text(
                                  'BƯỚC 1: QUÉT SẢN PHẨM',
                                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 8),
                                const Text(
                                  'Quét SKU sản phẩm từ giỏ lấy hàng để nhận ô cất.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: AppColors.textSecondary, fontSize: 15),
                                )
                              ] else ...[
                                Card(
                                  color: AppColors.warning.withOpacity(0.15),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    side: const BorderSide(color: AppColors.warning, width: 3),
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 36),
                                    child: Column(
                                      children: [
                                        const Text(
                                          'BƯỚC 2: BỎ HÀNG VÀO Ô KỆ',
                                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                                        ),
                                        const SizedBox(height: 12),
                                        Text(
                                          _targetSlot,
                                          style: const TextStyle(fontSize: 72, fontWeight: FontWeight.bold, letterSpacing: 4, color: AppColors.warning),
                                        ),
                                        const SizedBox(height: 12),
                                        Text(
                                          'Sản phẩm: $_lastScannedSku',
                                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 32),
                                const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.center_focus_strong, color: AppColors.primary, size: 28),
                                    SizedBox(width: 8),
                                    Text(
                                      'Quét mã vạch Ô kệ để xác nhận bỏ hàng',
                                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                    )
                                  ],
                                )
                              ]
                            ],
                          ),
              ),

              // Bàn quét thủ công
              if (_waveId.isNotEmpty)
                ElevatedButton.icon(
                  onPressed: _showManualInputDialog,
                  icon: const Icon(Icons.keyboard),
                  label: const Text('Nhập mã thủ công'),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
