import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/utils/role_manager.dart';

class DashboardScreen extends StatelessWidget {
  final AppRole role;
  
  const DashboardScreen({super.key, required this.role});

  @override
  Widget build(BuildContext context) {
    // Nếu là Manager, hiển thị biểu đồ và tổng quan
    if (role == AppRole.manager) {
      return Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Thống kê sức chứa kho',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  children: const [
                    Text('Warehouse A', style: TextStyle(fontSize: 18)),
                    SizedBox(height: 8),
                    LinearProgressIndicator(value: 0.75, minHeight: 12),
                    SizedBox(height: 8),
                    Text('75% Đã lấp đầy'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Công việc tồn đọng (Backlog): 120 Orders'),
          ],
        ),
      );
    }
    
    // Nếu là Operator, hiển thị các nút thao tác nhanh to rõ
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ElevatedButton.icon(
            onPressed: () => context.push('/wms/receive'),
            icon: const Icon(Icons.inbox, size: 32),
            label: const Text('Nhận Hàng (Inbound)'),
            style: ElevatedButton.styleFrom(padding: const EdgeInsets.all(24)),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () => context.push('/wms/pick'),
            icon: const Icon(Icons.outbox, size: 32),
            label: const Text('Lấy Hàng (Pick)'),
            style: ElevatedButton.styleFrom(padding: const EdgeInsets.all(24)),
          ),
        ],
      ),
    );
  }
}
