import '../../../core/network/api_client.dart';
import '../../../core/error/failures.dart';
import '../../../core/utils/result.dart';
import 'participation_status.dart';

/// Request model for creating a participation
class CreateParticipationRequest {
  final String blanId;
  final String userId;

  const CreateParticipationRequest({
    required this.blanId,
    required this.userId,
  });

  Map<String, dynamic> toJson() {
    return {
      'blanId': blanId,
      'userId': userId,
    };
  }
}

/// Response model for participation API calls
class ParticipationDto {
  final String id;
  final String blanId;
  final String userId;
  final String status; // REQUESTED, ACCEPTED, etc.
  final DateTime? createdAt;

  const ParticipationDto({
    required this.id,
    required this.blanId,
    required this.userId,
    required this.status,
    this.createdAt,
  });

  factory ParticipationDto.fromJson(Map<String, dynamic> json) {
    DateTime? createdAt;
    if (json['createdAt'] != null) {
      try {
        createdAt = DateTime.parse(json['createdAt'] as String);
      } catch (e) {
        print('⚠️ Failed to parse createdAt: ${json['createdAt']}');
      }
    }

    return ParticipationDto(
      id: json['id'] as String? ?? '',
      blanId: json['blanId'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      status: json['status'] as String? ?? 'REQUESTED',
      createdAt: createdAt,
    );
  }

  /// Convert API status string to ParticipationStatus enum
  ParticipationStatus get participationStatus {
    switch (status.toUpperCase()) {
      case 'NOT_REQUESTED':
        return ParticipationStatus.notRequested;
      case 'REQUESTED':
        return ParticipationStatus.requested;
      case 'SHORTLISTED':
        return ParticipationStatus.shortlisted;
      case 'ACCEPTED':
        return ParticipationStatus.accepted;
      case 'REJECTED':
        return ParticipationStatus.rejected;
      case 'CANCELED':
        return ParticipationStatus.canceled;
      case 'LEFT':
        return ParticipationStatus.left;
      default:
        return ParticipationStatus.notRequested;
    }
  }
}

/// Service for handling BLAN participations (join requests)
class ParticipationService {
  final ApiClient apiClient;

  ParticipationService({ApiClient? apiClient})
      : apiClient = apiClient ?? ApiClient();

  /// Create a participation request for a BLAN
  Future<Result<ParticipationDto>> createParticipation(
    String blanId,
    String userId,
  ) async {
    print('👥 Creating participation for BLAN: $blanId, User: $userId');
    
    final request = CreateParticipationRequest(
      blanId: blanId,
      userId: userId,
    );

    final result = await apiClient.post(
      '/participations',
      body: request.toJson(),
    );

    return result.when(
      success: (json) {
        try {
          final response = ParticipationDto.fromJson(json);
          print('✅ Participation created successfully: id=${response.id}, status=${response.status}');
          return Success(response);
        } catch (e) {
          print('❌ Error parsing participation response: $e');
          return Failure(
            NetworkFailure('Failed to parse participation response: ${e.toString()}'),
          );
        }
      },
      failure: (failure) {
        print('❌ Failed to create participation: $failure');
        return Failure(failure);
      },
    );
  }
}

