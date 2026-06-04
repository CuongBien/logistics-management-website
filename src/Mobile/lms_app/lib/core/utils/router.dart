import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/home/presentation/main_skeleton.dart';
import '../../features/wms/inbound/presentation/receive_scan_screen.dart';
import '../../features/wms/inbound/presentation/cross_dock_screen.dart';
import '../../features/wms/outbound/presentation/pick_execution_screen.dart';
import '../../features/wms/outbound/presentation/pick_task_list_screen.dart';
import '../../features/wms/outbound/presentation/put_to_wall_screen.dart';
import '../../features/wms/outbound/presentation/pack_order_screen.dart';
import '../../features/wms/outbound/presentation/dispatch_load_screen.dart';
import '../../features/wms/putaway/presentation/putaway_execution_screen.dart';
import '../../features/wms/inventory/presentation/inventory_search_screen.dart';
import '../../features/wms/inventory/presentation/cycle_count_screen.dart';
import '../../features/wms/inbound/presentation/transit_receive_screen.dart';
import '../../features/wms/outbound/presentation/sort_screen.dart';
import '../../features/wms/returns/presentation/receive_return_screen.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(authProvider.notifier).checkAuthStatus());
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}

class RouterNotifier extends ChangeNotifier {
  final Ref _ref;

  RouterNotifier(this._ref) {
    _ref.listen<AuthState>(
      authProvider,
      (_, __) => notifyListeners(),
    );
  }
}

final routerNotifierProvider = Provider((ref) => RouterNotifier(ref));

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = ref.watch(routerNotifierProvider);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: notifier,
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final isAuth = authState is AuthAuthenticated;
      final isGoingToLogin = state.matchedLocation == '/login';

      if (authState is AuthInitial) {
        return '/'; 
      }
      
      if (authState is AuthLoading && state.matchedLocation == '/') {
        return '/';
      }

      if (!isAuth && !isGoingToLogin) {
        return '/login';
      }

      if (isAuth && (isGoingToLogin || state.matchedLocation == '/')) {
        return '/main';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/main',
        builder: (context, state) => const MainSkeleton(),
      ),
      GoRoute(
        path: '/wms/receive',
        builder: (context, state) => const ReceiveScanScreen(),
      ),
      GoRoute(
        path: '/wms/pick',
        builder: (context, state) => const PickTaskListScreen(),
      ),
      GoRoute(
        path: '/wms/pick_execution/:waveId',
        builder: (context, state) {
          final waveId = state.pathParameters['waveId'] ?? 'WAVE-001';
          return PickExecutionScreen(waveId: waveId);
        },
      ),
      GoRoute(
        path: '/wms/putaway',
        builder: (context, state) {
          final taskId = state.uri.queryParameters['taskId'] ?? 'N/A';
          final targetBin = state.uri.queryParameters['targetBin'] ?? 'N/A';
          return PutawayExecutionScreen(taskId: taskId, targetBin: targetBin);
        },
      ),
      GoRoute(
        path: '/wms/inventory',
        builder: (context, state) => const InventorySearchScreen(),
      ),
      GoRoute(
        path: '/wms/put_to_wall',
        builder: (context, state) => const PutToWallScreen(),
      ),
      GoRoute(
        path: '/wms/pack',
        builder: (context, state) => const PackOrderScreen(),
      ),
      GoRoute(
        path: '/wms/dispatch',
        builder: (context, state) => const DispatchLoadScreen(),
      ),
      GoRoute(
        path: '/wms/returns',
        builder: (context, state) => const ReceiveReturnScreen(),
      ),
      GoRoute(
        path: '/wms/count',
        builder: (context, state) => const CycleCountScreen(),
      ),
      GoRoute(
        path: '/wms/crossdock',
        builder: (context, state) {
          final taskId = state.uri.queryParameters['taskId'] ?? 'N/A';
          final targetBin = state.uri.queryParameters['targetBin'] ?? 'N/A';
          return CrossDockScreen(taskId: taskId, targetBin: targetBin);
        },
      ),
      GoRoute(
        path: '/wms/transit-receive',
        builder: (context, state) => const TransitReceiveScreen(),
      ),
      GoRoute(
        path: '/wms/sort',
        builder: (context, state) => const SortScreen(),
      ),
    ],
  );
});
