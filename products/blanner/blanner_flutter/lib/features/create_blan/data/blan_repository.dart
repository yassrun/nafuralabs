import '../../../core/error/failures.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/result.dart';
import '../../user/application/current_user_provider.dart';
import '../models/blan_creation_request.dart';
import '../models/create_blan_api_request.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Repository for creating blans
class BlanRepository {
  final ApiClient apiClient;
  final Ref? ref;

  BlanRepository({ApiClient? apiClient, this.ref})
      : apiClient = apiClient ?? ApiClient();

  /// Create a new blan
  Future<Result<Map<String, dynamic>>> createBlan(
    BlanCreationRequest request,
  ) async {
    // Get current user ID for creatorId
    String? creatorId;
    if (ref != null) {
      final user = ref!.read(currentUserProvider);
      if (user == null) {
        return Failure(
          NetworkFailure(
            'User must be logged in to create a blan',
            code: '401',
          ),
        );
      }
      creatorId = user.id;
    } else {
      // Fallback: throw error if ref is not provided
      throw StateError('BlanRepository requires a Ref to get current user');
    }

    // Convert BlanCreationRequest to API request format
    final apiRequest = CreateBlanApiRequest.fromBlanCreationRequest(
      request,
      creatorId,
    );
    final payload = apiRequest.toJson();
    
    print('📝 BlanRepository.createBlan called');
    print('📦 Create BLAN API Payload: $payload');
    
    final result = await apiClient.post(
      '/blans',
      body: payload,
    );

    return result.when(
      success: (json) {
        print('✅ BlanRepository received success: $json');
        return Success(json);
      },
      failure: (failure) {
        print('❌ BlanRepository received failure: $failure');
        return Failure(failure);
      },
    );
  }
}

