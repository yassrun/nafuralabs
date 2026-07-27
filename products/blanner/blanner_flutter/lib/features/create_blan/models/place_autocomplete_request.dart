/// Search type for place autocomplete
enum SearchType {
  exact,
  area;

  String toJson() {
    return name.toUpperCase();
  }
}

/// Request model for place autocomplete API
class PlaceAutocompleteRequest {
  final String query;
  final double? lat;
  final double? lng;
  final String? category; // Category ID or name from backend
  final SearchType? searchType; // EXACT or AREA

  const PlaceAutocompleteRequest({
    required this.query,
    this.lat,
    this.lng,
    this.category,
    this.searchType,
  });

  Map<String, dynamic> toJson() {
    return {
      'query': query,
      if (lat != null) 'lat': lat,
      if (lng != null) 'lng': lng,
      if (category != null) 'category': category,
      if (searchType != null) 'searchType': searchType!.toJson(),
    };
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is PlaceAutocompleteRequest &&
        other.query == query &&
        other.lat == lat &&
        other.lng == lng &&
        other.category == category &&
        other.searchType == searchType;
  }

  @override
  int get hashCode {
    return Object.hash(query, lat, lng, category, searchType);
  }
}

