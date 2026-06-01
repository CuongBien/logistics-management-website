import 'package:flutter/material.dart';
import '../../../../../core/constants/app_colors.dart';

class CrossDockScreen extends StatelessWidget {
  const CrossDockScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cross-Docking')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.error.withOpacity(0.1),
                border: Border.all(color: AppColors.error, width: 2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Column(
                children: [
                  Icon(Icons.warning, color: AppColors.error, size: 64),
                  SizedBox(height: 16),
                  Text(
                    'ĐỪNG CẤT LÊN KỆ!',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.error),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Sản phẩm này đang được chờ gấp cho đơn hàng xuất kho.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 16),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Card(
              child: Padding(
                padding: EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    Text('MANG ĐẾN CỬA XUẤT BẾN', style: TextStyle(fontSize: 16, color: AppColors.textSecondary)),
                    SizedBox(height: 8),
                    Text('DOCK-03', style: TextStyle(fontSize: 48, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ),
            const Spacer(),
            ElevatedButton(
              onPressed: () {},
              child: const Text('ĐÃ BÀN GIAO CHO DOCK'),
            )
          ],
        ),
      ),
    );
  }
}
