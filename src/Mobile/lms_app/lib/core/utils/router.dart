import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
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

// Import tạm thời các widget placeholder
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    body: Center(
      child: ElevatedButton(
        onPressed: () => context.go('/main'), 
        child: const Text('Vào App')
      )
    )
  );
}

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: Text('Login Screen')));
}

final router = GoRouter(
  initialLocation: '/',
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
      builder: (context, state) => const CrossDockScreen(),
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
