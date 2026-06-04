import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_config.dart';
import '../../../../core/network/connectivity_service.dart';
import '../../../../core/network/offline_queue.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/error/error_handler.dart';
import '../../auth/providers/auth_provider.dart';

class ProfileTabScreen extends ConsumerStatefulWidget {
  const ProfileTabScreen({super.key});

  @override
  ConsumerState<ProfileTabScreen> createState() => _ProfileTabScreenState();
}

class _ProfileTabScreenState extends ConsumerState<ProfileTabScreen> {
  bool _isSyncing = false;
  bool _isLoadingWarehouses = false;
  List<dynamic> _warehouses = [];

  @override
  void initState() {
    super.initState();
    _loadWarehouses();
  }

  Future<void> _loadWarehouses() async {
    setState(() => _isLoadingWarehouses = true);
    try {
      final response = await apiClient.dio.get('/Warehouse?all=true');
      if (response.statusCode == 200) {
        setState(() {
          _warehouses = response.data as List<dynamic>;
        });
      }
    } catch (e) {
      // Bỏ qua lỗi hoặc log, vì có thể offline
    } finally {
      setState(() => _isLoadingWarehouses = false);
    }
  }

  Future<void> _syncOfflineData() async {
    setState(() => _isSyncing = true);
    try {
      final queue = ref.read(offlineQueueProvider);
      final config = ref.read(appConfigProvider);

      if (queue.pendingCount == 0) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Không có dữ liệu ngoại tuyến cần đồng bộ!'),
          backgroundColor: AppColors.primary,
        ));
        return;
      }

      final result = await queue.syncAll(apiClient.dio, config.apiBaseUrl);
      ref.read(pendingCountProvider.notifier).set(queue.pendingCount);

      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Kết quả đồng bộ'),
            content: Text(
              'Tổng số tác vụ: ${result.total}\n'
              'Thành công: ${result.succeeded}\n'
              'Thất bại: ${result.failed}'
              '${result.errors.isNotEmpty ? "\n\nChi tiết lỗi:\n" + result.errors.join("\n") : ""}',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Đóng'),
              )
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ErrorHandler.showError(context, e);
      }
    } finally {
      setState(() => _isSyncing = false);
    }
  }

  void _showWarehouseSelector() {
    if (_warehouses.isEmpty && !_isLoadingWarehouses) {
      _loadWarehouses();
    }

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Chọn kho làm việc'),
          content: _isLoadingWarehouses
              ? const SizedBox(
                  height: 100,
                  child: Center(child: CircularProgressIndicator()),
                )
              : _warehouses.isEmpty
                  ? const Text('Không tải được danh sách kho hoặc không có kho nào có sẵn.')
                  : SizedBox(
                      width: double.maxFinite,
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: _warehouses.length,
                        itemBuilder: (context, index) {
                          final wh = _warehouses[index];
                          final id = wh['id'] as String;
                          final name = wh['name'] as String;

                          return ListTile(
                            title: Text(name),
                            subtitle: Text('ID: ${id.substring(0, 8)}...'),
                            onTap: () async {
                              Navigator.pop(context);
                              final newContext = WarehouseContext(warehouseId: id, warehouseName: name);
                              await newContext.save();
                              ref.read(warehouseContextProvider.notifier).setWarehouse(newContext);
                              
                              ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                                content: Text('Đã chuyển sang kho: $name'),
                                backgroundColor: AppColors.success,
                              ));
                            },
                          );
                        },
                      ),
                    ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Hủy'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final userProfile = ref.watch(currentUserProvider);
    final selectedWarehouse = ref.watch(warehouseContextProvider);
    final isOnline = ref.watch(isOnlineProvider).value ?? true;
    final pendingCount = ref.watch(pendingCountProvider);

    final bool isManager = userProfile?.isManager ?? false;
    final String roleName = isManager ? 'Quản lý kho (Manager)' : 'Nhân viên vận hành (Operator)';

    return Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Card Thông tin cá nhân
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    const CircleAvatar(
                      radius: 45,
                      backgroundColor: AppColors.primary,
                      child: Icon(Icons.person, size: 50, color: Colors.white),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      userProfile?.username ?? 'Tên tài khoản',
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      roleName,
                      style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
                    ),
                    if (userProfile?.email != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        userProfile!.email!,
                        style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Card Chọn kho
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: ListTile(
                leading: const Icon(Icons.warehouse, color: AppColors.primary, size: 28),
                title: const Text('Kho đang làm việc', style: TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text(
                  selectedWarehouse != null 
                      ? selectedWarehouse.warehouseName 
                      : (userProfile?.warehouseName ?? 'Chưa chọn kho'),
                  style: const TextStyle(fontSize: 15, color: AppColors.textPrimary),
                ),
                trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                onTap: _showWarehouseSelector,
              ),
            ),
            const SizedBox(height: 16),

            // Card Quản lý Offline
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Chế độ Ngoại tuyến & Đồng bộ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Trạng thái kết nối:'),
                        Row(
                          children: [
                            Container(
                              width: 10,
                              height: 10,
                              decoration: BoxDecoration(
                                color: isOnline ? AppColors.success : AppColors.error,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              isOnline ? 'Trực tuyến (Online)' : 'Ngoại tuyến (Offline)',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: isOnline ? AppColors.success : AppColors.error,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Tác vụ đang chờ đồng bộ:'),
                        Chip(
                          label: Text(
                            '$pendingCount tác vụ',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                          backgroundColor: pendingCount > 0 ? AppColors.warning : AppColors.success,
                        ),
                      ],
                    ),
                    if (pendingCount > 0) ...[
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        onPressed: _isSyncing || !isOnline ? null : _syncOfflineData,
                        icon: _isSyncing 
                            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.sync),
                        label: Text(_isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ dữ liệu ngay'),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                      if (!isOnline)
                        const Padding(
                          padding: EdgeInsets.only(top: 8.0),
                          child: Text(
                            '* Bạn cần kết nối mạng để có thể đồng bộ dữ liệu ngoại tuyến lên server.',
                            style: TextStyle(color: AppColors.error, fontSize: 12, fontStyle: FontStyle.italic),
                          ),
                        ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Nút Đăng xuất
            ElevatedButton.icon(
              onPressed: () {
                ref.read(authProvider.notifier).logout();
              },
              icon: const Icon(Icons.logout),
              label: const Text('Đăng xuất khỏi hệ thống', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: AppColors.error,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
