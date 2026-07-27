import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/category.dart';

/// Cache manager for categories
/// Stores categories in memory and persists them to SharedPreferences
class CategoriesCache {
  static const String _cacheKey = 'cached_categories';
  static const String _cacheTimestampKey = 'cached_categories_timestamp';
  static const Duration _cacheExpiry = Duration(hours: 24); // Cache for 24 hours

  List<Category>? _cachedCategories;
  DateTime? _cacheTimestamp;

  /// Get cached categories from memory
  List<Category>? getCachedCategories() {
    if (_cachedCategories != null && _isCacheValid()) {
      return _cachedCategories;
    }
    return null;
  }

  /// Check if cache is still valid
  bool _isCacheValid() {
    if (_cacheTimestamp == null) return false;
    final now = DateTime.now();
    return now.difference(_cacheTimestamp!) < _cacheExpiry;
  }

  /// Save categories to cache (memory + SharedPreferences)
  Future<void> saveCategories(List<Category> categories) async {
    _cachedCategories = categories;
    _cacheTimestamp = DateTime.now();

    try {
      final prefs = await SharedPreferences.getInstance();
      
      // Convert categories to JSON
      final categoriesJson = categories.map((cat) => cat.toJson()).toList();
      await prefs.setString(_cacheKey, jsonEncode(categoriesJson));
      await prefs.setString(_cacheTimestampKey, _cacheTimestamp!.toIso8601String());
      
      print('✅ Categories cached successfully (${categories.length} items)');
    } catch (e) {
      print('⚠️ Failed to persist categories cache: $e');
      // Continue with in-memory cache even if persistence fails
    }
  }

  /// Load categories from SharedPreferences
  Future<List<Category>?> loadCachedCategories() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      final categoriesJsonString = prefs.getString(_cacheKey);
      final timestampString = prefs.getString(_cacheTimestampKey);
      
      if (categoriesJsonString == null || timestampString == null) {
        return null;
      }

      final timestamp = DateTime.parse(timestampString);
      final now = DateTime.now();
      
      // Check if cache is expired
      if (now.difference(timestamp) > _cacheExpiry) {
        print('⚠️ Categories cache expired');
        await clearCache();
        return null;
      }

      // Parse categories from JSON
      final categoriesJson = jsonDecode(categoriesJsonString) as List<dynamic>;
      final categories = categoriesJson
          .map((json) => Category.fromJson(json as Map<String, dynamic>))
          .toList();

      // Update in-memory cache
      _cachedCategories = categories;
      _cacheTimestamp = timestamp;

      print('✅ Loaded ${categories.length} categories from cache');
      return categories;
    } catch (e) {
      print('⚠️ Failed to load categories from cache: $e');
      return null;
    }
  }

  /// Clear cache (memory + SharedPreferences)
  Future<void> clearCache() async {
    _cachedCategories = null;
    _cacheTimestamp = null;

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_cacheKey);
      await prefs.remove(_cacheTimestampKey);
      print('✅ Categories cache cleared');
    } catch (e) {
      print('⚠️ Failed to clear categories cache: $e');
    }
  }

  /// Force refresh cache (clear and fetch new)
  Future<void> invalidateCache() async {
    await clearCache();
  }
}

