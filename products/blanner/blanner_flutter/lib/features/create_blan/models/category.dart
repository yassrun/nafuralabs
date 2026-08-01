import '../../../core/utils/category_image_helper.dart';

/// Category model matching backend response
class Category {
  final String id; // UUID as String
  final String name;
  final String? icon; // Renamed from emoji to match backend
  final String? defaultImage; // Renamed from defaultImageUrl to match backend
  final int? orderIndex;
  final String? googleTags; // Comma-separated string from backend
  final String? locationTitle; // Dynamic title for location picker (e.g., "Pick your coffee spot")
  final bool? isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Category({
    required this.id,
    required this.name,
    this.icon,
    this.defaultImage,
    this.orderIndex,
    this.googleTags,
    this.locationTitle,
    this.isActive,
    this.createdAt,
    this.updatedAt,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    // Handle both camelCase (default Spring Boot) and snake_case JSON formats
    // Safe type conversion helpers that handle null and type mismatches
    String? getStringField(String camelCase, String snakeCase) {
      final value = json[camelCase] ?? json[snakeCase];
      if (value == null) return null;
      if (value is String) return value;
      return value.toString();
    }
    
    int? getIntField(String camelCase, String snakeCase) {
      final value = json[camelCase] ?? json[snakeCase];
      if (value == null) return null;
      if (value is int) return value;
      if (value is String) return int.tryParse(value);
      return null;
    }
    
    bool? getBoolField(String camelCase, String snakeCase) {
      final value = json[camelCase] ?? json[snakeCase];
      if (value == null) return null;
      if (value is bool) return value;
      if (value is String) {
        return value.toLowerCase() == 'true';
      }
      return null;
    }
    
    DateTime? parseDateTime(String? value) {
      if (value == null) return null;
      try {
        return DateTime.parse(value);
      } catch (e) {
        return null;
      }
    }

    // Handle googleTags as either array or comma-separated string
    String? getGoogleTagsValue() {
      final tagsValue = json['googleTags'] ?? json['google_tags'];
      if (tagsValue == null) return null;
      
      if (tagsValue is List) {
        // Convert array to comma-separated string
        return tagsValue
            .map((tag) => tag.toString())
            .where((tag) => tag.isNotEmpty)
            .join(',');
      } else if (tagsValue is String) {
        return tagsValue;
      }
      return tagsValue.toString();
    }

    // Safe extraction of required fields
    // Backend uses 'id' field with UUID format
    final id = json['id'];
    final name = json['name'];
    
    if (id == null || name == null) {
      print('❌ Category parsing error - missing id or name');
      print('   Available keys: ${json.keys.toList()}');
      print('   Full JSON: $json');
      throw FormatException('Category must have id and name fields. Available keys: ${json.keys.toList()}');
    }

    final categoryId = id.toString();
    final categoryName = name.toString();
    print('📋 Parsed category: $categoryName (ID: $categoryId)');
    
    // Log category image lookup for debugging
    final testImage = CategoryImageHelper.getCategoryImageAsset(categoryName);
    if (testImage != null) {
      print('   ✅ Has image: $testImage');
    } else {
      print('   ❌ No image found for "$categoryName"');
    }

    return Category(
      id: categoryId,
      name: name.toString(),
      icon: getStringField('icon', 'icon'),
      defaultImage: getStringField('defaultImage', 'default_image'),
      orderIndex: getIntField('orderIndex', 'order_index'),
      googleTags: getGoogleTagsValue(),
      locationTitle: getStringField('locationTitle', 'location_title'),
      isActive: getBoolField('isActive', 'is_active'),
      createdAt: parseDateTime(getStringField('createdAt', 'created_at')),
      updatedAt: parseDateTime(getStringField('updatedAt', 'updated_at')),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      if (icon != null) 'icon': icon,
      if (defaultImage != null) 'defaultImage': defaultImage,
      if (orderIndex != null) 'orderIndex': orderIndex,
      if (googleTags != null) 'googleTags': googleTags,
      if (locationTitle != null) 'locationTitle': locationTitle,
      if (isActive != null) 'isActive': isActive,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }

  /// Helper method to get display label
  String toLabel() => name;

  /// Helper method to get icon/emoji (fallback to empty string)
  String toEmoji() => icon ?? '';

  /// Helper method to get default image URL or local asset path
  /// Returns local asset path if available, otherwise returns defaultImage from backend
  String getDefaultImageUrl() {
    // First try to get local asset image
    final localAsset = CategoryImageHelper.getCategoryImageAsset(name);
    if (localAsset != null) {
      return localAsset;
    }
    // Fallback to backend defaultImage if available
    return defaultImage ?? '';
  }
  
  /// Helper method to check if category has a local asset image
  bool hasLocalImage() {
    return CategoryImageHelper.hasCategoryImage(name);
  }

  /// Helper method to get Google Places types as List (parsed from comma-separated string)
  List<String> getGooglePlacesTypes() {
    if (googleTags == null || googleTags!.isEmpty) {
      return [];
    }
    return googleTags!
        .split(',')
        .map((tag) => tag.trim())
        .where((tag) => tag.isNotEmpty)
        .toList();
  }
}

