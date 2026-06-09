import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/utils/role_manager.dart';
import '../../../core/constants/app_colors.dart';
import '../../auth/providers/auth_provider.dart';
import 'dashboard_screen.dart';
import 'scan_tab_screen.dart';
import 'profile_tab_screen.dart';
import '../../wms/inventory/presentation/warehouse_layout_screen.dart';
import '../../wms/notification/providers/notification_providers.dart';

class MainSkeleton extends ConsumerStatefulWidget {
  const MainSkeleton({super.key});

  @override
  ConsumerState<MainSkeleton> createState() => _MainSkeletonState();
}

class _MainSkeletonState extends ConsumerState<MainSkeleton> {
  int _currentIndex = 0;
  AppRole _currentRole = AppRole.operator; // Mặc định để test

  @override
  void initState() {
    super.initState();
    _loadRole();
  }

  Future<void> _loadRole() async {
    final role = await RoleManager.getCurrentRole();
    // Tạm thời fix cứng role nếu chưa có token để hiển thị UI
    setState(() {
      _currentRole = role == AppRole.unknown ? AppRole.manager : role;
    });
  }

  @override
  Widget build(BuildContext context) {
    final userProfile = ref.watch(currentUserProvider);
    final bool isManager = userProfile?.isManager ?? false;
    final String roleName = isManager ? 'Quản lý kho' : 'Nhân viên kho';
    final unreadCount = ref.watch(unreadNotificationsCountProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('LMS Enterprise'),
        centerTitle: true,
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications),
                onPressed: () => context.push('/notifications'),
              ),
              if (unreadCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      '$unreadCount',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      // Đã gỡ bỏ Drawer (Nav bar bên trái) theo yêu cầu
      body: _currentIndex == 0 
          ? DashboardScreen(role: _currentRole)
          : _currentIndex == 1
              ? const WarehouseLayoutScreen()
              : _currentIndex == 2
                  ? const ScanTabScreen()
                  : const ProfileTabScreen(),
      floatingActionButton: FloatingActionButton(
        onPressed: () => setState(() => _currentIndex = 2), // Chuyển sang màn hình Quét mã
        backgroundColor: AppColors.primary,
        elevation: 4,
        shape: const CircleBorder(),
        child: const Icon(Icons.qr_code_scanner, color: Colors.white, size: 28),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: BottomAppBar(
        shape: const CircularNotchedRectangle(),
        notchMargin: 8.0,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            children: [
              Expanded(child: _buildNavItem(icon: Icons.assignment, label: 'Tác vụ', index: 0)),
              Expanded(child: _buildNavItem(icon: Icons.map, label: 'Sơ đồ', index: 1)),
              const SizedBox(width: 48), // Khoảng trống cho nút FAB ở giữa
              Expanded(
                child: InkWell(
                  onTap: () => _showQuickUtilitiesBottomSheet(context),
                  borderRadius: BorderRadius.circular(8),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 4),
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.apps, color: Colors.grey, size: 24),
                          const SizedBox(height: 4),
                          const Text(
                            'Tiện ích', 
                            style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.normal),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              Expanded(child: _buildNavItem(icon: Icons.person, label: 'Cá nhân', index: 3)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({required IconData icon, required String label, required int index}) {
    final isSelected = _currentIndex == index;
    final color = isSelected ? AppColors.primary : Colors.grey;
    return InkWell(
      onTap: () => setState(() => _currentIndex = index),
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 6),
        child: FittedBox(
          fit: BoxFit.scaleDown,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: color, size: 24), // Fix cứng size icon
              const SizedBox(height: 4),
              Text(
                label, 
                style: TextStyle(color: color, fontSize: 10, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showQuickUtilitiesBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return SingleChildScrollView(
          child: Container(
            padding: EdgeInsets.only(
              top: 24, left: 16, right: 16,
              bottom: MediaQuery.of(context).viewInsets.bottom + 24
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                'TIỆN ÍCH NGHIỆP VỤ NHANH',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textPrimary,
                  letterSpacing: 1.1,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              Wrap(
                spacing: 16,
                runSpacing: 24,
                alignment: WrapAlignment.spaceEvenly,
                children: [
                  _buildUtilityButton(context: context, icon: Icons.download, label: 'Nhập kho', onTap: () { Navigator.pop(context); context.push('/wms/receive'); }, color: Colors.green),
                  _buildUtilityButton(context: context, icon: Icons.compare_arrows, label: 'Luân chuyển', onTap: () { Navigator.pop(context); context.push('/wms/transit-receive'); }, color: Colors.purple),
                  _buildUtilityButton(context: context, icon: Icons.fact_check, label: 'Kiểm kê', onTap: () { Navigator.pop(context); context.push('/wms/count'); }, color: Colors.orange),
                  _buildUtilityButton(context: context, icon: Icons.category, label: 'Chia chọn', onTap: () { Navigator.pop(context); context.push('/wms/sort'); }, color: Colors.blue),
                  _buildUtilityButton(context: context, icon: Icons.inventory_2, label: 'Đóng gói', onTap: () { Navigator.pop(context); context.push('/wms/pack'); }, color: Colors.deepPurple),
                  _buildUtilityButton(context: context, icon: Icons.local_shipping, label: 'Xuất bến', onTap: () { Navigator.pop(context); context.push('/wms/dispatch'); }, color: Colors.redAccent),
                  _buildUtilityButton(context: context, icon: Icons.outbox, label: 'Xuất lẻ', onTap: () { Navigator.pop(context); context.push('/wms/ship_release'); }, color: Colors.deepOrange),
                  _buildUtilityButton(context: context, icon: Icons.delivery_dining, label: 'Lấy hàng', onTap: () { Navigator.pop(context); context.push('/delivery/pickup'); }, color: Colors.indigo),
                  _buildUtilityButton(context: context, icon: Icons.search, label: 'Tra cứu', onTap: () { Navigator.pop(context); context.push('/wms/inventory'); }, color: Colors.blueGrey),
                ],
              ),
            ],
          ),
        ));
      },
    );
  }

  Widget _buildUtilityButton({required BuildContext context, required IconData icon, required String label, required VoidCallback onTap, required Color color}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: SizedBox(
        width: 80,
        child: Column(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: color.withOpacity(0.1),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
