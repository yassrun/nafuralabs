import '../../../core/network/api_client.dart';
import '../../../core/error/failures.dart';
import '../../../core/utils/result.dart';
import '../models/my_blan.dart';
import '../models/blan_for_my_blans.dart';
import '../../home_feed/data/participation_status.dart';
import '../../create_blan/models/enums.dart';

/// Repository for fetching user's BLANs (created, participating, requests)
class MyBlansRepository {
  final ApiClient apiClient;

  MyBlansRepository({ApiClient? apiClient})
      : apiClient = apiClient ?? ApiClient();

  /// Get BLANs created by the current user
  Future<Result<List<MyBlan>>> getMyCreatedBlans({
    required String userId,
    int page = 0,
    int size = 20,
  }) async {
    print('🌐 Fetching created BLANs from API...');
    print('   userId: $userId, page: $page, size: $size');

    final queryParams = <String, String>{
      'userId': userId,
      'page': page.toString(),
      'size': size.toString(),
    };

    final result = await apiClient.get(
      '/blans/created',
      queryParameters: queryParams,
    );

    return result.when(
      success: (json) {
        try {
          // Parse paginated response
          List<dynamic> blansList;
          if (json.containsKey('content') && json['content'] is List) {
            blansList = json['content'] as List<dynamic>;
          } else if (json.containsKey('data') && json['data'] is List) {
            blansList = json['data'] as List<dynamic>;
          } else {
            blansList = <dynamic>[];
          }

          final blans = <MyBlan>[];
          for (var item in blansList) {
            try {
              if (item is Map<String, dynamic>) {
                final blan = _mapApiResponseToMyBlan(item, isOrganizer: true);
                if (blan != null) {
                  blans.add(blan);
                }
              }
            } catch (e, stackTrace) {
              print('❌ Error parsing created blan: $e');
              print('   Stack trace: $stackTrace');
              continue;
            }
          }

          print('✅ Fetched ${blans.length} created BLANs from API');
          return Success(blans);
        } catch (e) {
          print('❌ Error parsing created blans response: $e');
          return Failure(
            NetworkFailure('Failed to parse created blans: ${e.toString()}'),
          );
        }
      },
      failure: (failure) {
        print('❌ Failed to fetch created blans: $failure');
        return Failure(failure);
      },
    );
  }

  /// Get BLANs the user is participating in (accepted requests)
  Future<Result<List<MyBlan>>> getMyParticipatingBlans({
    required String userId,
    int page = 0,
    int size = 20,
  }) async {
    print('🌐 Fetching participating BLANs from API...');
    print('   userId: $userId, page: $page, size: $size');

    final queryParams = <String, String>{
      'userId': userId,
      'page': page.toString(),
      'size': size.toString(),
    };

    final result = await apiClient.get(
      '/blans/participating',
      queryParameters: queryParams,
    );

    return result.when(
      success: (json) {
        try {
          // Parse paginated response
          List<dynamic> blansList;
          if (json.containsKey('content') && json['content'] is List) {
            blansList = json['content'] as List<dynamic>;
          } else if (json.containsKey('data') && json['data'] is List) {
            blansList = json['data'] as List<dynamic>;
          } else {
            blansList = <dynamic>[];
          }

          final blans = <MyBlan>[];
          for (var item in blansList) {
            try {
              if (item is Map<String, dynamic>) {
                final blan = _mapApiResponseToMyBlan(item, isOrganizer: false);
                if (blan != null) {
                  blans.add(blan);
                }
              }
            } catch (e, stackTrace) {
              print('❌ Error parsing participating blan: $e');
              print('   Stack trace: $stackTrace');
              continue;
            }
          }

          print('✅ Fetched ${blans.length} participating BLANs from API');
          return Success(blans);
        } catch (e) {
          print('❌ Error parsing participating blans response: $e');
          return Failure(
            NetworkFailure('Failed to parse participating blans: ${e.toString()}'),
          );
        }
      },
      failure: (failure) {
        print('❌ Failed to fetch participating blans: $failure');
        return Failure(failure);
      },
    );
  }

  /// Get pending requests to join BLANs (user's requests that are pending)
  Future<Result<List<MyBlan>>> getMyPendingRequests({
    required String userId,
    int page = 0,
    int size = 20,
  }) async {
    print('🌐 Fetching requested BLANs from API...');
    print('   userId: $userId, page: $page, size: $size');

    final queryParams = <String, String>{
      'userId': userId,
      'page': page.toString(),
      'size': size.toString(),
    };

    final result = await apiClient.get(
      '/blans/requests',
      queryParameters: queryParams,
    );

    return result.when(
      success: (json) {
        try {
          // Parse paginated response
          List<dynamic> blansList;
          if (json.containsKey('content') && json['content'] is List) {
            blansList = json['content'] as List<dynamic>;
          } else if (json.containsKey('data') && json['data'] is List) {
            blansList = json['data'] as List<dynamic>;
          } else {
            blansList = <dynamic>[];
          }

          final blans = <MyBlan>[];
          for (var item in blansList) {
            try {
              if (item is Map<String, dynamic>) {
                final blan = _mapApiResponseToMyBlan(item, isOrganizer: false);
                if (blan != null) {
                  blans.add(blan);
                }
              }
            } catch (e, stackTrace) {
              print('❌ Error parsing requested blan: $e');
              print('   Stack trace: $stackTrace');
              continue;
            }
          }

          print('✅ Fetched ${blans.length} requested BLANs from API');
          return Success(blans);
        } catch (e) {
          print('❌ Error parsing requested blans response: $e');
          return Failure(
            NetworkFailure('Failed to parse requested blans: ${e.toString()}'),
          );
        }
      },
      failure: (failure) {
        print('❌ Failed to fetch requested blans: $failure');
        return Failure(failure);
      },
    );
  }

  /// Get pending requests for BLANs I created (people requesting to join my BLANs)
  Future<List<BlanRequest>> getPendingRequestsForMyBlans(String blanId) async {
    // TODO: Replace with actual API call
    await Future.delayed(const Duration(milliseconds: 300));
    
    // Mock data - requests to join my BLANs
    return [
      BlanRequest(
        id: 'req-1',
        blanId: blanId,
        userId: 'user-1',
        userName: 'Alice Johnson',
        userAvatarUrl: null,
        requestedAt: DateTime.now().subtract(const Duration(hours: 2)),
      ),
      BlanRequest(
        id: 'req-2',
        blanId: blanId,
        userId: 'user-2',
        userName: 'Bob Martinez',
        userAvatarUrl: null,
        requestedAt: DateTime.now().subtract(const Duration(hours: 5)),
      ),
    ];
  }

  /// Accept a request to join a BLAN
  Future<void> acceptRequest(String requestId) async {
    // TODO: Replace with actual API call
    await Future.delayed(const Duration(milliseconds: 300));
  }

  /// Reject a request to join a BLAN
  Future<void> rejectRequest(String requestId) async {
    // TODO: Replace with actual API call
    await Future.delayed(const Duration(milliseconds: 300));
  }

  /// Get created BLANs (returns List<BlanForMyBlans>)
  Future<Result<List<BlanForMyBlans>>> getCreatedBlans({
    required String userId,
  }) async {
    final result = await getMyCreatedBlans(userId: userId);
    
    return result.when(
      success: (myBlans) {
        final blans = myBlans.map((myBlan) => _mapMyBlanToBlanForMyBlans(myBlan)).toList();
        return Success(blans);
      },
      failure: (failure) => Failure(failure),
    );
  }

  /// Get My Activity data (accepted, pending, not selected)
  Future<Result<MyActivityData>> getMyActivity({
    required String userId,
  }) async {
    // Fetch participating and pending requests
    final participatingResult = await getMyParticipatingBlans(userId: userId);
    final pendingResult = await getMyPendingRequests(userId: userId);

    return participatingResult.when(
      success: (participatingBlans) {
        return pendingResult.when(
          success: (pendingBlans) {
            // Separate into accepted, pending, and not selected
            final accepted = <BlanForMyBlans>[];
            final pending = <BlanForMyBlans>[];
            final notSelected = <BlanForMyBlans>[];

            // Process participating BLANs (these are accepted)
            for (final myBlan in participatingBlans) {
              if (myBlan.status == ParticipationStatus.accepted) {
                accepted.add(_mapMyBlanToBlanForMyBlans(myBlan, includeParticipationStatus: true));
              }
            }

            // Process pending requests
            for (final myBlan in pendingBlans) {
              if (myBlan.status == ParticipationStatus.requested) {
                pending.add(_mapMyBlanToBlanForMyBlans(myBlan, includeParticipationStatus: true));
              } else if (myBlan.status == ParticipationStatus.rejected || 
                         myBlan.status == ParticipationStatus.shortlisted) {
                notSelected.add(_mapMyBlanToBlanForMyBlans(myBlan, includeParticipationStatus: true));
              }
            }

            return Success(MyActivityData(
              accepted: accepted,
              pending: pending,
              notSelected: notSelected,
            ));
          },
          failure: (failure) => Failure(failure),
        );
      },
      failure: (failure) => Failure(failure),
    );
  }

  /// Map MyBlan to BlanForMyBlans
  BlanForMyBlans _mapMyBlanToBlanForMyBlans(
    MyBlan myBlan, {
    bool includeParticipationStatus = false,
  }) {
    // Determine BlanStatus from date and participation status
    BlanStatus blanStatus;
    if (myBlan.status == ParticipationStatus.canceled) {
      blanStatus = BlanStatus.canceled;
    } else {
      final now = DateTime.now();
      blanStatus = myBlan.dateTime.isBefore(now) 
          ? BlanStatus.past 
          : BlanStatus.upcoming;
    }

    // Parse mood from API (default to chill if not available)
    Mood mood = Mood.chill;
    // TODO: Extract mood from API response when available
    // For now, default to chill

    return BlanForMyBlans(
      id: myBlan.id,
      title: myBlan.title,
      category: myBlan.category,
      mood: mood,
      dateTime: myBlan.dateTime,
      locationLabel: myBlan.locationName,
      participantsCount: myBlan.currentParticipants,
      maxParticipants: myBlan.maxParticipants,
      status: blanStatus,
      pendingRequestsCount: myBlan.pendingRequests,
      participationStatus: includeParticipationStatus ? myBlan.status : null,
    );
  }

  /// Map API response (BlanFeedItemDto) to MyBlan model
  MyBlan? _mapApiResponseToMyBlan(
    Map<String, dynamic> json, {
    required bool isOrganizer,
  }) {
    try {
      // Parse dateTime - BlanFeedItemDto has dateTime directly (LocalDateTime)
      DateTime? dateTime;
      if (json['dateTime'] != null) {
        try {
          // Handle ISO 8601 format from Java LocalDateTime
          final dateTimeStr = json['dateTime'] as String;
          dateTime = DateTime.parse(dateTimeStr);
        } catch (e) {
          print('⚠️ Failed to parse dateTime: ${json['dateTime']}');
        }
      }

      // Fallback: try parsing from schedule if dateTime is not directly available
      if (dateTime == null) {
        final schedule = json['schedule'] as Map<String, dynamic>?;
        if (schedule != null) {
          final dateStr = schedule['date'] as String?;
          final timeStr = schedule['time'] as String?;
          if (dateStr != null && timeStr != null) {
            try {
              dateTime = DateTime.parse('$dateStr $timeStr');
            } catch (e) {
              print('⚠️ Failed to parse dateTime from schedule: $dateStr $timeStr');
            }
          }
        }
      }

      // Parse location - use locationMode from DTO or fallback to location object
      String locationName = 'Location TBD';
      final locationMode = json['locationMode'] as String?;
      if (locationMode != null) {
        // Map locationMode to readable name
        switch (locationMode.toUpperCase()) {
          case 'EXACT_PLACE':
            locationName = 'Specific Location';
            break;
          case 'AREA':
            locationName = 'Area';
            break;
          case 'FLEXIBLE':
            locationName = 'Flexible';
            break;
          default:
            locationName = locationMode;
        }
      }

      // Fallback: try parsing from location object if available
      if (locationName == 'Location TBD') {
        final location = json['location'] as Map<String, dynamic>?;
        if (location != null) {
          locationName = location['placeName'] as String? ??
              location['areaName'] as String? ??
              location['mode'] as String? ??
              'Location TBD';
        }
      }

      // Get category - BlanFeedItemDto has 'category' directly
      final categoryName = json['category'] as String? ??
          json['categoryName'] as String? ??
          'Activity';

      // Get title - BlanFeedItemDto has 'title' directly
      final title = json['title'] as String? ?? categoryName;

      // Get image URL - BlanFeedItemDto has 'coverImageUrl'
      final imageUrl = json['coverImageUrl'] as String? ??
          json['imageUrl'] as String? ??
          'https://picsum.photos/400/300?random=${json['id']}';

      // Get participant counts - BlanFeedItemDto has 'participantsCount'
      final participantsCount = json['participantsCount'] as int? ??
          json['joinCount'] as int? ??
          0;
      final maxParticipants = json['maxParticipants'] as int? ?? 0;

      // Get participation status - use userParticipationStatus from DTO
      ParticipationStatus participationStatus = ParticipationStatus.notRequested;
      final userParticipationStatusStr = json['userParticipationStatus'] as String?;

      if (userParticipationStatusStr != null) {
        switch (userParticipationStatusStr.toUpperCase()) {
          case 'NOT_REQUESTED':
            participationStatus = ParticipationStatus.notRequested;
            break;
          case 'REQUESTED':
            participationStatus = ParticipationStatus.requested;
            break;
          case 'SHORTLISTED':
            participationStatus = ParticipationStatus.shortlisted;
            break;
          case 'ACCEPTED':
            participationStatus = ParticipationStatus.accepted;
            break;
          case 'REJECTED':
            participationStatus = ParticipationStatus.rejected;
            break;
          case 'CANCELED':
            participationStatus = ParticipationStatus.canceled;
            break;
          case 'LEFT':
            participationStatus = ParticipationStatus.left;
            break;
          default:
            participationStatus = ParticipationStatus.notRequested;
        }
      }

      // Get organizer name (only if not organizer)
      String? organizerName;
      if (!isOrganizer) {
        organizerName = json['ownerName'] as String? ??
            json['creatorName'] as String? ??
            'Unknown';
      }

      // Get pending requests count (only for created BLANs)
      final pendingRequests = json['pendingRequests'] as int? ??
          json['pendingRequestsCount'] as int? ??
          0;

      return MyBlan(
        id: json['id'] as String? ?? '',
        title: title,
        category: categoryName,
        dateTime: dateTime ?? DateTime.now(),
        locationName: locationName,
        imageUrl: imageUrl,
        currentParticipants: participantsCount,
        maxParticipants: maxParticipants > 0 ? maxParticipants : 100,
        status: participationStatus,
        isOrganizer: isOrganizer,
        organizerName: organizerName,
        pendingRequests: isOrganizer ? pendingRequests : 0,
      );
    } catch (e, stackTrace) {
      print('❌ Error mapping MyBlan from API response: $e');
      print('   Stack trace: $stackTrace');
      return null;
    }
  }
}

