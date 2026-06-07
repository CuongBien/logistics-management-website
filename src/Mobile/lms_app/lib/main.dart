import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'core/utils/router.dart';
import 'core/network/connectivity_service.dart';
import 'core/network/api_client.dart';
import 'core/constants/app_config.dart';
import 'features/wms/notification/providers/notification_providers.dart';
import 'features/wms/notification/domain/notification_models.dart';
import 'core/widgets/in_app_notification_toast.dart';

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
    // Cấu hình ApiClient baseUrl động theo AppConfig
    final config = ref.watch(appConfigProvider);
    apiClient.dio.options.baseUrl = config.apiBaseUrl;

    // Theo dõi trạng thái mạng, mặc định coi là online (chỉ báo lỗi khi chắc chắn false)
    final isOffline = ref.watch(isOnlineProvider).value == false;
    final router = ref.watch(routerProvider);

    // Lắng nghe thông báo thời gian thực SignalR để hiển thị in-app toast
    ref.listen<AsyncValue<AppNotification>>(
      notificationIncomingStreamProvider,
      (previous, next) {
        next.whenData((notification) {
          InAppNotificationToast.show(
            context: context,
            notification: notification,
            onTap: () {
              router.push('/notifications');
            },
          );
        });
      },
    );

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
