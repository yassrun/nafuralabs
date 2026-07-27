class Area {
  final String id;
  final String name;
  final double? latitude;
  final double? longitude;
  final double? radiusKm; // For map pin selections
  final bool isNeighborhood; // true if predefined neighborhood, false if map pin

  const Area({
    required this.id,
    required this.name,
    this.latitude,
    this.longitude,
    this.radiusKm,
    this.isNeighborhood = true,
  });

  Area copyWith({
    String? id,
    String? name,
    double? latitude,
    double? longitude,
    double? radiusKm,
    bool? isNeighborhood,
  }) {
    return Area(
      id: id ?? this.id,
      name: name ?? this.name,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      radiusKm: radiusKm ?? this.radiusKm,
      isNeighborhood: isNeighborhood ?? this.isNeighborhood,
    );
  }
}

