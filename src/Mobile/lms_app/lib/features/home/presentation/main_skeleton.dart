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
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(color: Color(0xFF0052CC)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const CircleAvatar(
                    radius: 30,
                    backgroundColor: Colors.white,
                    child: Icon(Icons.person, size: 35, color: Color(0xFF0052CC)),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    userProfile?.username ?? 'Nhân viên',
                    style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    roleName,
                    style: const TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                  if (userProfile?.warehouseName != null)
                    Text(
                      'Kho: ${userProfile!.warehouseName}',
                      style: const TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                ],
              ),
            ),
            if (RoleManager.hasAccessToOms(_currentRole)) ...[
              const ListTile(
                title: Text('Hệ thống OMS', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
              ),
              ListTile(
                leading: const Icon(Icons.list_alt),
                title: const Text('Quản lý đơn hàng'),
                onTap: () {},
              ),
            ],
            const ListTile(
              title: Text('Hệ thống WMS', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
            ),
            ListTile(
              leading: const Icon(Icons.home),
              title: const Text('Trang chủ / Tác vụ'),
              onTap: () {
                Navigator.pop(context);
                setState(() => _currentIndex = 0);
              },
            ),
            ListTile(
              leading: const Icon(Icons.map),
              title: const Text('Sơ đồ & Cấu trúc kho'),
              onTap: () {
                Navigator.pop(context);
                setState(() => _currentIndex = 1);
              },
            ),
            ListTile(
              leading: const Icon(Icons.qr_code_scanner),
              title: const Text('Quét mã thông minh'),
              onTap: () {
                Navigator.pop(context);
                setState(() => _currentIndex = 2);
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.inventory_2),
              title: const Text('Đóng gói (Pack)'),
              onTap: () {
                Navigator.pop(context);
                context.push('/wms/pack');
              },
            ),
            ListTile(
              leading: const Icon(Icons.local_shipping),
              title: const Text('Xuất bến (Dispatch)'),
              onTap: () {
                Navigator.pop(context);
                context.push('/wms/dispatch');
              },
            ),
            ListTile(
              leading: const Icon(Icons.fact_check),
              title: const Text('Kiểm kê (Cycle Count)'),
              onTap: () {
                Navigator.pop(context);
                context.push('/wms/count');
              },
            ),
            ListTile(
              leading: const Icon(Icons.search),
              title: const Text('Tra cứu tồn kho'),
              onTap: () {
                Navigator.pop(context);
                context.push('/wms/inventory');
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: const Text('Đăng xuất', style: TextStyle(color: Colors.red)),
              onTap: () {
                ref.read(authProvider.notifier).logout();
              },
            ),
          ],
        ),
      ),
      body: _currentIndex == 0 
          ? DashboardScreen(role: _currentRole)
          : _currentIndex == 1
              ? const WarehouseLayoutScreen()
              : _currentIndex == 2
                  ? const ScanTabScreen()
                  : const ProfileTabScreen(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment),
            label: 'Tác vụ',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.map),
            label: 'Sơ đồ kho',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.qr_code_scanner, size: 28),
            label: 'Quét mã',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Cá nhân',
          ),
        ],
      ),
    );
  }
}
