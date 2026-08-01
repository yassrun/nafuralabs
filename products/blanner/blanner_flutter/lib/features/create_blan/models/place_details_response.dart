import 'real_place.dart';

/// Response model for place details API
class PlaceDetailsResponse {
  final RealPlace? place;

  const PlaceDetailsResponse({
    this.place,
  });

  factory PlaceDetailsResponse.fromJson(Map<String, dynamic> json) {
    final placeJson = json['place'] as Map<String, dynamic>?;
    return PlaceDetailsResponse(
      place: placeJson != null ? RealPlace.fromJson(placeJson) : null,
    );
  }
}

