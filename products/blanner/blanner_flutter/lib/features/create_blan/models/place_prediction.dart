/// Place prediction from Google Places Autocomplete
class PlacePrediction {
  final String id; // Place ID (used for fetching details)
  final String name;
  final String? secondaryText;
  final List<String> types;

  const PlacePrediction({
    required this.id,
    required this.name,
    this.secondaryText,
    this.types = const [],
  });

  factory PlacePrediction.fromJson(Map<String, dynamic> json) {
    // Handle both camelCase and snake_case
    String? getString(String camelCase, String snakeCase) {
      final value = json[camelCase] ?? json[snakeCase];
      return value?.toString();
    }

    List<String> getTypes() {
      final typesValue = json['types'];
      if (typesValue == null) return [];
      if (typesValue is List) {
        return typesValue
            .map((type) => type.toString())
            .where((type) => type.isNotEmpty)
            .toList();
      }
      return [];
    }

    final id = getString('id', 'id') ?? '';
    final name = getString('name', 'name') ?? '';

    return PlacePrediction(
      id: id,
      name: name,
      secondaryText: getString('secondaryText', 'secondary_text'),
      types: getTypes(),
    );
  }

  /// Get place ID (alias for id, used when fetching details)
  String get placeId => id;

  /// Get description (alias for name, for backward compatibility)
  String get description => name;

  /// Get main text (alias for name, for backward compatibility)
  String? get mainText => name;
}

