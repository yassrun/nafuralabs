import '../../../core/network/api_client.dart';
import '../../../core/error/failures.dart';
import '../../../core/utils/result.dart';
import 'blan_model.dart';
import 'participation_status.dart';

/// Paginated response model
class PaginatedBlans {
  final List<Blan> content;
  final int totalElements;
  final int totalPages;
  final int currentPage;
  final int size;
  final bool hasNext;
  final bool hasPrevious;

  const PaginatedBlans({
    required this.content,
    required this.totalElements,
    required this.totalPages,
    required this.currentPage,
    required this.size,
    required this.hasNext,
    required this.hasPrevious,
  });
}

/// Repository for fetching blans from the backend API
class BlanRepository {
  final ApiClient apiClient;

  BlanRepository({ApiClient? apiClient})
      : apiClient = apiClient ?? ApiClient();

  /// Fetch paginated blans feed from the backend
  Future<Result<PaginatedBlans>> getBlansFeed({
    required String userId,
    double? lat,
    double? lng,
    int page = 0,
    int size = 20,
    String? filter,
  }) async {
    print('🌐 Fetching blans feed from API...');
    print('   userId: $userId, lat: $lat, lng: $lng, page: $page, size: $size');
    
    final queryParams = <String, String>{
      'userId': userId,
      'page': page.toString(),
      'size': size.toString(),
    };
    
    if (lat != null) {
      queryParams['lat'] = lat.toString();
    }
    if (lng != null) {
      queryParams['lng'] = lng.toString();
    }
    
    final result = await apiClient.get('/blans/feed', queryParameters: queryParams);

    return result.when(
      success: (json) {
        try {
          print('📦 API response JSON structure: ${json.keys.toList()}');
          
          // Spring Page response structure
          // { content: [...], totalElements: int, totalPages: int, number: int, size: int, ... }
          List<dynamic> blansList;
          
          if (json.containsKey('content') && json['content'] is List) {
            blansList = json['content'] as List<dynamic>;
          } else if (json.containsKey('data') && json['data'] is List) {
            // Fallback to data field
            blansList = json['data'] as List<dynamic>;
          } else {
            // Try to find any list in the response
            final firstList = json.values.firstWhere(
              (value) => value is List,
              orElse: () => <dynamic>[],
            );
            blansList = firstList as List<dynamic>;
          }

          final blans = <Blan>[];
          for (var item in blansList) {
            try {
              if (item is Map<String, dynamic>) {
                final blan = _mapApiResponseToBlan(item);
                if (blan != null) {
                  blans.add(blan);
                }
              }
            } catch (e, stackTrace) {
              print('❌ Error parsing blan: $e');
              print('   Item: $item');
              print('   Stack trace: $stackTrace');
              continue;
            }
          }

          // Apply filter if provided (client-side filtering)
          final filteredBlans = _applyFilter(blans, filter);
          
          // Extract pagination info
          final totalElements = json['totalElements'] as int? ?? filteredBlans.length;
          final totalPages = json['totalPages'] as int? ?? 1;
          final currentPage = json['number'] as int? ?? page; // Spring uses 'number' for current page
          final pageSize = json['size'] as int? ?? size;
          final hasNext = json['hasNext'] as bool? ?? (currentPage < totalPages - 1);
          final hasPrevious = json['hasPrevious'] as bool? ?? (currentPage > 0);
          
          final paginatedBlans = PaginatedBlans(
            content: filteredBlans,
            totalElements: totalElements,
            totalPages: totalPages,
            currentPage: currentPage,
            size: pageSize,
            hasNext: hasNext,
            hasPrevious: hasPrevious,
          );
          
          print('✅ Fetched ${filteredBlans.length} blans from API (page $currentPage of $totalPages)');
          return Success(paginatedBlans);
        } catch (e) {
          print('❌ Error parsing blans response: $e');
          return Failure(
            NetworkFailure('Failed to parse blans: ${e.toString()}'),
          );
        }
      },
      failure: (failure) {
        print('❌ Failed to fetch blans: $failure');
        return Failure(failure);
      },
    );
  }

  /// Legacy method for backward compatibility - fetches first page
  @Deprecated('Use getBlansFeed instead')
  Future<Result<List<Blan>>> getBlans({String? filter}) async {
    // For now, use a default userId - this should be removed once all callers are updated
    final result = await getBlansFeed(
      userId: '550e8400-e29b-41d4-a716-446655440000', // Mock user ID
      filter: filter,
    );
    
    return result.when(
      success: (paginated) => Success(paginated.content),
      failure: (failure) => Failure(failure),
    );
  }

  /// Map API response to Blan model
  Blan? _mapApiResponseToBlan(Map<String, dynamic> json) {
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

      // Map billPolicy to priceType (if available)
      final billPolicy = json['billPolicy'] as String?;
      String priceType = 'Free';
      if (billPolicy == 'TO_BE_DECIDED' || billPolicy == 'SPLIT') {
        priceType = 'Paid';
      } else if (billPolicy == 'HOST_PAYS') {
        priceType = 'Free';
      }

      // Get category - BlanFeedItemDto has 'category' directly
      final categoryName = json['category'] as String? ?? 
                          json['categoryName'] as String? ??
                          'Activity';
      
      print('🏷️ BlanRepository: Parsing BLAN with category: "$categoryName"');
      
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
      
      // Get reaction data from backend (from BlanFeedItemDto)
      final userLiked = json['userLiked'] as bool? ?? false;
      final userSaved = json['userSaved'] as bool? ?? false;
      final likeCount = json['likeCount'] as int? ?? 0;
      final saveCount = json['saveCount'] as int? ?? 0;
      
      // Get distance from backend if available
      final distanceKm = json['distanceKm'] as double? ?? 
                        (json['distance'] as num?)?.toDouble() ?? 0.0;
      
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
      
      // Fallback: try parsing from old field names for backward compatibility
      if (participationStatus == ParticipationStatus.notRequested) {
        final userParticipating = json['userParticipating'] as bool? ?? false;
        if (userParticipating) {
          participationStatus = ParticipationStatus.accepted;
        } else {
          final participationStatusStr = json['participationStatus'] as String?;
          if (participationStatusStr != null) {
            switch (participationStatusStr.toUpperCase()) {
              case 'REQUESTED':
                participationStatus = ParticipationStatus.requested;
                break;
              case 'ACCEPTED':
              case 'APPROVED':
                participationStatus = ParticipationStatus.accepted;
                break;
              case 'REJECTED':
              case 'DECLINED':
                participationStatus = ParticipationStatus.rejected;
                break;
              case 'SHORTLISTED':
                participationStatus = ParticipationStatus.shortlisted;
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
        }
      }

      return Blan(
        id: json['id'] as String? ?? '',
        title: title,
        category: categoryName,
        dateTime: dateTime ?? DateTime.now(),
        locationName: locationName,
        distanceKm: distanceKm,
        imageUrl: imageUrl,
        priceType: priceType,
        currentParticipants: participantsCount,
        maxParticipants: maxParticipants > 0 ? maxParticipants : 100,
        organizerName: json['ownerName'] as String? ?? 
                      json['creatorName'] as String? ?? 
                      'Unknown',
        status: participationStatus,
        userLiked: userLiked,
        userSaved: userSaved,
        likeCount: likeCount,
        saveCount: saveCount,
      );
    } catch (e, stackTrace) {
      print('❌ Error mapping blan from API response: $e');
      print('   Stack trace: $stackTrace');
      return null;
    }
  }


  /// Apply filter to blans list
  List<Blan> _applyFilter(List<Blan> blans, String? filter) {
    if (filter == null || filter == 'Trending') {
      return blans;
    }

    switch (filter) {
      case 'Nearby':
        // TODO: Filter by actual distance when location is available
        return blans.where((b) => b.distanceKm < 5).toList();
      case 'For you':
        return blans.take(3).toList();
      case 'Coffee':
        return blans.where((b) => b.category.toLowerCase().contains('coffee')).toList();
      case 'Sport':
        return blans.where((b) => b.category.toLowerCase().contains('sport') || 
                                b.category.toLowerCase().contains('fitness') ||
                                b.category.toLowerCase().contains('gym')).toList();
      case 'Cinema':
        return blans.where((b) => b.category.toLowerCase().contains('cinema') ||
                                b.category.toLowerCase().contains('movie')).toList();
      case 'Games':
        return blans.where((b) => b.category.toLowerCase().contains('game')).toList();
      case 'Food & Drinks':
        return blans.where((b) => b.category.toLowerCase().contains('food') ||
                                b.category.toLowerCase().contains('restaurant') ||
                                b.category.toLowerCase().contains('drink')).toList();
      default:
        return blans;
    }
  }
}

