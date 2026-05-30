import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../data/returns_repository.dart';

final returnsRepositoryProvider = Provider<ReturnsRepository>((ref) {
  return ReturnsRepository(apiClient);
});
