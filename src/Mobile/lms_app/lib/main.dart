import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'core/utils/router.dart';
import 'core/network/connectivity_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    // Bọc app bằng ProviderScope để dùng Riverpod
    const ProviderScope(
      child: LMSApp(),
    ),
  );
}

class LMSApp extends ConsumerWidget {
  const LMSApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Theo dõi trạng thái mạng, mặc định coi là online (chỉ báo lỗi khi chắc chắn false)
    final isOffline = ref.watch(isOnlineProvider).value == false;
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'LMS Enterprise',
      theme: AppTheme.lightTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
      builder: (context, child) {
        return Column(
          children: [
            if (isOffline)
              Container(
                color: Colors.red,
                width: double.infinity,
                padding: const EdgeInsets.only(top: 40, bottom: 8),
                child: const Text(
                  'Mất kết nối mạng - Đang hoạt động ngoại tuyến',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white, 
                    fontSize: 14, 
                    fontWeight: FontWeight.bold,
                    decoration: TextDecoration.none
                  ),
                ),
              ),
            Expanded(child: child ?? const SizedBox()),
          ],
        );
      },
    );
  }
}
