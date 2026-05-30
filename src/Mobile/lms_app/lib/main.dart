import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'core/utils/router.dart';

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
    return MaterialApp.router(
      title: 'LMS Enterprise',
      theme: AppTheme.lightTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
