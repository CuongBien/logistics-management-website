import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/utils/role_manager.dart';
import 'dashboard_screen.dart';

class MainSkeleton extends StatefulWidget {
  const MainSkeleton({super.key});

  @override
  State<MainSkeleton> createState() => _MainSkeletonState();
}

class _MainSkeletonState extends State<MainSkeleton> {
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
    final bool isManager = _currentRole == AppRole.manager;

    return Scaffold(
      appBar: AppBar(
        title: const Text('LMS Enterprise'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications),
            onPressed: () {},
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
                    isManager ? 'Quản lý kho' : 'Nhân viên kho',
                    style: const TextStyle(color: Colors.white, fontSize: 18),
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
              leading: const Icon(Icons.download),
              title: const Text('Nhập kho (Inbound)'),
              onTap: () {
                Navigator.pop(context); // Close drawer
                context.push('/wms/receive');
              },
            ),
            ListTile(
              leading: const Icon(Icons.compare_arrows),
              title: const Text('Nhận hàng luân chuyển'),
              onTap: () {
                Navigator.pop(context);
                context.push('/wms/transit-receive');
              },
            ),
            ListTile(
              leading: const Icon(Icons.bolt),
              title: const Text('Luân chuyển nhanh (Cross-Dock)'),
              onTap: () {
                Navigator.pop(context);
                context.push('/wms/crossdock');
              },
            ),
            ListTile(
              leading: const Icon(Icons.upload),
              title: const Text('Xuất kho (Lấy hàng)'),
              onTap: () {
                Navigator.pop(context);
                context.push('/wms/pick');
              },
            ),
            ListTile(
              leading: const Icon(Icons.grid_view),
              title: const Text('Chia chọn (Sort)'),
              onTap: () {
                Navigator.pop(context);
                context.push('/wms/sort');
              },
            ),
            ListTile(
              leading: const Icon(Icons.category),
              title: const Text('Chia chọn (Put To Wall)'),
              onTap: () {
                Navigator.pop(context);
                context.push('/wms/put_to_wall');
              },
            ),
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
              leading: const Icon(Icons.move_to_inbox),
              title: const Text('Cất hàng (Putaway)'),
              onTap: () {
                Navigator.pop(context);
                context.push('/wms/putaway');
              },
            ),
            ListTile(
              leading: const Icon(Icons.inventory),
              title: const Text('Tra cứu tồn kho'),
              onTap: () {
                Navigator.pop(context);
                context.push('/wms/inventory');
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.assignment_return),
              title: const Text('Nhận hàng hoàn (Returns)'),
              onTap: () {
                Navigator.pop(context);
                context.push('/wms/returns');
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
          ],
        ),
      ),
      body: _currentIndex == 0 
          ? DashboardScreen(role: _currentRole)
          : const Center(child: Text('Coming Soon')),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Trang chủ',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.qr_code_scanner, size: 32),
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
