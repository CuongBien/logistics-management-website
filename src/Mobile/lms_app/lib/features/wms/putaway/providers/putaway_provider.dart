import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../data/putaway_repository.dart';

final putawayRepositoryProvider = Provider<PutawayRepository>((ref) {
  return PutawayRepository(apiClient);
});
