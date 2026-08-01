import 'blan_creation_request.dart';
import 'enums.dart';

/// API request model for creating a blan
/// Maps from BlanCreationRequest to the API format
class CreateBlanApiRequest {
  final String categoryId;
  final String creatorId; // Creator ID (required)
  final Map<String, dynamic>? location;
  final Map<String, dynamic> schedule;
  final String groupSize;
  final String genderPref;
  final String mood;
  final String billPolicy;
  final String visibility;
  final bool approvalRequired;
  final int? maxParticipants;
  final String? customDescription;

  CreateBlanApiRequest({
    required this.categoryId,
    required this.creatorId,
    this.location,
    required this.schedule,
    required this.groupSize,
    required this.genderPref,
    required this.mood,
    required this.billPolicy,
    required this.visibility,
    this.approvalRequired = false,
    this.maxParticipants,
    this.customDescription,
  });

  /// Create from BlanCreationRequest
  factory CreateBlanApiRequest.fromBlanCreationRequest(
    BlanCreationRequest request,
    String creatorId,
  ) {
    // Build location object if locationMode is set
    // Note: FLEXIBLE mode might not need location object, or API might require it to be null
    Map<String, dynamic>? location;
    if (request.locationMode != null) {
      if (request.locationMode == LocationMode.exact && request.place != null) {
        location = {
          'mode': request.locationMode!.toJson(),
          'placeId': request.place!.placeId ?? request.place!.id,
          'placeName': request.place!.name,
          'address': request.place!.address,
          'latitude': request.place!.latitude,
          'longitude': request.place!.longitude,
        };
      } else if (request.locationMode == LocationMode.area && request.area != null) {
        location = {
          'mode': request.locationMode!.toJson(),
          'areaName': request.area!.name,
          // Add area bounding box if available
          if (request.area!.latitude != null && request.area!.longitude != null)
            'areaBoundingBox': {
              'center': {
                'latitude': request.area!.latitude,
                'longitude': request.area!.longitude,
              },
              if (request.area!.radiusKm != null)
                'radiusKm': request.area!.radiusKm,
            },
        };
      }
      // For FLEXIBLE mode, don't include location object - API might expect it to be null/omitted
      // If API requires it, uncomment below:
      // else if (request.locationMode == LocationMode.flexible) {
      //   location = {
      //     'mode': request.locationMode!.toJson(),
      //   };
      // }
    }

    // Build schedule object
    final dateTime = request.dateTime!;
    final dateStr = '${dateTime.year}-${dateTime.month.toString().padLeft(2, '0')}-${dateTime.day.toString().padLeft(2, '0')}';
    final timeStr = '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}:00';
    
    // Determine time phrase based on hour
    String timePhrase;
    final hour = dateTime.hour;
    if (hour >= 5 && hour < 12) {
      timePhrase = 'Morning';
    } else if (hour >= 12 && hour < 17) {
      timePhrase = 'Afternoon';
    } else if (hour >= 17 && hour < 21) {
      timePhrase = 'Evening';
    } else {
      timePhrase = 'Night';
    }

    final schedule = {
      'date': dateStr,
      'time': timeStr,
      'timePhrase': timePhrase,
    };

    // Category ID is required
    if (request.category == null) {
      throw ArgumentError('Category is required to create a blan');
    }

    final categoryId = request.category!.id;
    print('📋 Creating BLAN with category: ${request.category!.name}');
    print('   Category ID to send: $categoryId');
    print('   Category ID type: ${categoryId.runtimeType}');
    print('   Category ID length: ${categoryId.length}');

    return CreateBlanApiRequest(
      categoryId: categoryId,
      creatorId: creatorId,
      location: location,
      schedule: schedule,
      groupSize: request.groupSize!.toJson(),
      genderPref: request.genderPref!.toJson(),
      mood: request.mood!.toJson(),
      billPolicy: request.billPolicy!.toJson(),
      visibility: request.visibility!.toJson(),
      approvalRequired: request.approvalRequired,
      maxParticipants: request.maxParticipants,
      customDescription: request.customDescription,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{
      'categoryId': categoryId,
      'creatorId': creatorId,
      'schedule': schedule,
      'groupSize': groupSize,
      'genderPref': genderPref,
      'mood': mood,
      'billPolicy': billPolicy,
      'visibility': visibility,
      'approvalRequired': approvalRequired,
    };

    if (location != null) {
      json['location'] = location;
    }

    if (maxParticipants != null) {
      json['maxParticipants'] = maxParticipants;
    }

    if (customDescription != null && customDescription!.isNotEmpty) {
      json['customDescription'] = customDescription;
    }

    return json;
  }
}

