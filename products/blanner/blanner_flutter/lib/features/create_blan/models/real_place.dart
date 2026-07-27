class RealPlace {
  final String id;
  final String name;
  final String address;
  final double? latitude;
  final double? longitude;
  final List<String> photoUrls;
  final String? placeId; // Google Places ID

  const RealPlace({
    required this.id,
    required this.name,
    required this.address,
    this.latitude,
    this.longitude,
    this.photoUrls = const [],
    this.placeId,
  });

  factory RealPlace.fromJson(Map<String, dynamic> json) {
    // Handle both camelCase and snake_case
    String? getString(String camelCase, String snakeCase) {
      final value = json[camelCase] ?? json[snakeCase];
      return value?.toString();
    }

    double? getDouble(String camelCase, String snakeCase) {
      final value = json[camelCase] ?? json[snakeCase];
      if (value == null) return null;
      if (value is double) return value;
      if (value is int) return value.toDouble();
      if (value is String) return double.tryParse(value);
      return null;
    }

    List<String> getPhotoUrls() {
      final photos = json['photos'] ?? json['photoUrls'] ?? json['photo_urls'];
      if (photos == null) return [];
      if (photos is List) {
        return photos
            .map((photo) {
              if (photo is String) return photo;
              if (photo is Map) {
                return photo['url']?.toString() ?? 
                       photo['photoUrl']?.toString() ?? 
                       photo['reference']?.toString() ?? '';
              }
              return '';
            })
            .where((url) => url.isNotEmpty)
            .toList();
      }
      return [];
    }

    // Use 'id' as both id and placeId (they're the same in the backend response)
    final id = getString('id', 'id') ?? '';

    return RealPlace(
      id: id,
      name: getString('name', 'name') ?? '',
      address: getString('address', 'address') ?? '',
      latitude: getDouble('lat', 'lat') ?? getDouble('latitude', 'latitude'),
      longitude: getDouble('lng', 'lng') ?? getDouble('longitude', 'longitude'),
      photoUrls: getPhotoUrls(),
      placeId: id, // Use the same ID as placeId
    );
  }

  RealPlace copyWith({
    String? id,
    String? name,
    String? address,
    double? latitude,
    double? longitude,
    List<String>? photoUrls,
    String? placeId,
  }) {
    return RealPlace(
      id: id ?? this.id,
      name: name ?? this.name,
      address: address ?? this.address,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      photoUrls: photoUrls ?? this.photoUrls,
      placeId: placeId ?? this.placeId,
    );
  }
}

