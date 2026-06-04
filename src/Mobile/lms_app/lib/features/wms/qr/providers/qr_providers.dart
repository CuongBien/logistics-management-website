import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../services/qr_action_service.dart';
import '../services/qr_lookup_service.dart';
import '../services/qr_generate_service.dart';

final qrActionServiceProvider = Provider<QrActionService>((ref) {
  return QrActionService(apiClient);
});

final qrLookupServiceProvider = Provider<QrLookupService>((ref) {
  return QrLookupService(apiClient);
});

final qrGenerateServiceProvider = Provider<QrGenerateService>((ref) {
  return QrGenerateService(apiClient);
});
