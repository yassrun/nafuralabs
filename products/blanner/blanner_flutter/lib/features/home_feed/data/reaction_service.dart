import '../../../core/network/api_client.dart';
import '../../../core/error/failures.dart';
import '../../../core/utils/result.dart';

/// Response model for reaction API calls
class ReactionResponse {
  final bool userLiked;
  final bool userSaved;
  final int likeCount;
  final int saveCount;

  const ReactionResponse({
    required this.userLiked,
    required this.userSaved,
    required this.likeCount,
    required this.saveCount,
  });

  factory ReactionResponse.fromJson(Map<String, dynamic> json) {
    return ReactionResponse(
      userLiked: json['userLiked'] as bool? ?? false,
      userSaved: json['userSaved'] as bool? ?? false,
      likeCount: json['likeCount'] as int? ?? 0,
      saveCount: json['saveCount'] as int? ?? 0,
    );
  }
}

/// Service for handling BLAN reactions (like and save)
class ReactionService {
  final ApiClient apiClient;

  ReactionService({ApiClient? apiClient})
      : apiClient = apiClient ?? ApiClient();

  /// Toggle like status for a BLAN
  Future<Result<ReactionResponse>> toggleLike(String blanId) async {
    print('❤️ Toggling like for BLAN: $blanId');
    final result = await apiClient.post('/blans/$blanId/like');

    return result.when(
      success: (json) {
        try {
          final response = ReactionResponse.fromJson(json);
          print('✅ Like toggled successfully: userLiked=${response.userLiked}, count=${response.likeCount}');
          return Success(response);
        } catch (e) {
          print('❌ Error parsing like response: $e');
          return Failure(
            NetworkFailure('Failed to parse like response: ${e.toString()}'),
          );
        }
      },
      failure: (failure) {
        print('❌ Failed to toggle like: $failure');
        return Failure(failure);
      },
    );
  }

  /// Toggle save/bookmark status for a BLAN
  Future<Result<ReactionResponse>> toggleSave(String blanId) async {
    print('🔖 Toggling save for BLAN: $blanId');
    final result = await apiClient.post('/blans/$blanId/save');

    return result.when(
      success: (json) {
        try {
          final response = ReactionResponse.fromJson(json);
          print('✅ Save toggled successfully: userSaved=${response.userSaved}, count=${response.saveCount}');
          return Success(response);
        } catch (e) {
          print('❌ Error parsing save response: $e');
          return Failure(
            NetworkFailure('Failed to parse save response: ${e.toString()}'),
          );
        }
      },
      failure: (failure) {
        print('❌ Failed to toggle save: $failure');
        return Failure(failure);
      },
    );
  }
}

