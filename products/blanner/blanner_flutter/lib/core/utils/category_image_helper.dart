import 'package:flutter/widgets.dart';

/// Helper class to get local asset images for categories
class CategoryImageHelper {
  /// Maps category names to their corresponding image asset paths
  /// Based on the image files in assets/images/categories/
  static String? getCategoryImageAsset(String? categoryName) {
    if (categoryName == null) return null;

    // Normalize category name (lowercase, handle slashes, normalize spaces)
    // Replace slashes with spaces, then normalize multiple spaces to single space
    final normalized = categoryName.toLowerCase().trim().replaceAll('/', ' ').replaceAll(RegExp(r'\s+'), ' ');

    print('🔍 CategoryImageHelper: Looking for category "$categoryName" (normalized: "$normalized")');

    // Map category names to image file names
    // Images should be in PNG format (Flutter supports PNG natively)
    String? assetPath;
    
    if (normalized.contains('cinema') || normalized.contains('culture') || normalized.contains('movie')) {
      assetPath = 'assets/images/categories/Cinema.png';
    } else if (normalized.contains('coffee') || normalized.contains('cafe')) {
      assetPath = 'assets/images/categories/Coffee.png';
    } else if (normalized.contains('drinks') || normalized.contains('rooftop') || normalized.contains('lounge') || normalized.contains('party')) {
      assetPath = 'assets/images/categories/Drinks  Rooftop  Lounge.png';
    } else if (normalized.contains('food') || normalized.contains('restaurant')) {
      assetPath = 'assets/images/categories/Food  Restaurants.png';
    } else if (normalized.contains('games') || normalized.contains('gaming')) {
      assetPath = 'assets/images/categories/Games.png';
    } else if (normalized.contains('gym') || normalized.contains('fitness') || normalized.contains('sport')) {
      assetPath = 'assets/images/categories/Gym  Fitness.png';
    } else if (normalized.contains('nature') || normalized.contains('outdoor')) {
      assetPath = 'assets/images/categories/Outdoor  Nature.png';
    } else if (normalized.contains('study') || normalized.contains('work')) {
      assetPath = 'assets/images/categories/Study  Work.png';
    } else if (normalized.contains('party') && normalized.contains('night')) {
      assetPath = 'assets/images/categories/Party  Night Out.png';
    }

    if (assetPath != null) {
      print('✅ CategoryImageHelper: Found asset path: $assetPath');
    } else {
      print('❌ CategoryImageHelper: No asset found for category "$categoryName"');
    }

    return assetPath;
  }

  /// Gets the image asset as an AssetImage
  static AssetImage? getCategoryAssetImage(String? categoryName) {
    final assetPath = getCategoryImageAsset(categoryName);
    if (assetPath == null) return null;
    return AssetImage(assetPath);
  }

  /// Checks if an asset exists for a category
  static bool hasCategoryImage(String? categoryName) {
    return getCategoryImageAsset(categoryName) != null;
  }
}

