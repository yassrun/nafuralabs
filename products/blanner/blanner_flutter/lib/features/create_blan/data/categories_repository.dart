import '../../../core/network/api_client.dart';
import '../../../core/error/failures.dart';
import '../../../core/utils/result.dart';
import '../models/category.dart';
import 'categories_cache.dart';

/// Repository for fetching categories from the backend
/// Uses cache to avoid unnecessary API calls
class CategoriesRepository {
  final ApiClient apiClient;
  final CategoriesCache cache;

  CategoriesRepository({
    ApiClient? apiClient,
    CategoriesCache? cache,
  })  : apiClient = apiClient ?? ApiClient(),
        cache = cache ?? CategoriesCache();

  /// Fetch all categories from the backend
  /// CACHING DISABLED FOR NOW - Always fetches from API
  Future<Result<List<Category>>> getCategories({bool forceRefresh = false}) async {
    // CACHING DISABLED - Always fetch from API
    print('🌐 Fetching categories from API...');
    final result = await apiClient.get('/categories');
    print('📥 Raw API response received');
    print('📥 Result type: ${result.runtimeType}');

    return result.when(
      success: (json) {
        try {
          print('📦 API response JSON structure: ${json.keys.toList()}');
          print('📦 Full API response: $json');
          
          // Handle different response formats:
          // 1. Direct array: [{"id": "...", "name": "..."}, ...] (already wrapped by ApiClient)
          // 2. Wrapped in object: {"data": [...], "categories": [...], etc.}
          List<dynamic> categoriesList;

          // ApiClient already wraps arrays in {"data": [...]}, so check for that first
          if (json.containsKey('data') && json['data'] is List) {
            categoriesList = json['data'] as List<dynamic>;
          } else if (json.containsKey('categories') && json['categories'] is List) {
            categoriesList = json['categories'] as List<dynamic>;
          } else {
            // Try to find any list in the response
            final firstList = json.values.firstWhere(
              (value) => value is List,
              orElse: () => <dynamic>[],
            );
            categoriesList = firstList as List<dynamic>;
          }

          final categories = <Category>[];
          for (var item in categoriesList) {
            try {
              if (item is Map<String, dynamic>) {
                print('🔍 Parsing category item: $item');
                final category = Category.fromJson(item);
                categories.add(category);
                print('✅ Successfully parsed category: ${category.name} (ID: ${category.id})');
              } else {
                // Log or handle unexpected item type
                print('⚠️ Skipping non-map category item: $item (type: ${item.runtimeType})');
                continue;
              }
            } catch (e, stackTrace) {
              // Log individual category parsing errors but continue with others
              print('❌ Error parsing category: $e');
              print('   Item: $item');
              print('   Stack trace: $stackTrace');
              continue;
            }
          }

          // Filter active categories and sort by orderIndex
          final activeCategories = categories
              .where((cat) => cat.isActive != false) // Default to true if null
              .toList();
          
          activeCategories.sort((a, b) {
            // Sort by orderIndex (null values go to end)
            if (a.orderIndex == null && b.orderIndex == null) return 0;
            if (a.orderIndex == null) return 1;
            if (b.orderIndex == null) return -1;
          return a.orderIndex!.compareTo(b.orderIndex!);
        });

        // CACHING DISABLED - Not saving to cache
        print('✅ Categories fetched from API (${activeCategories.length} items)');

        return Success(activeCategories);
      } catch (e) {
        return Failure(
          NetworkFailure('Failed to parse categories: ${e.toString()}'),
        );
      }
    },
    failure: (failure) {
      // CACHING DISABLED - No fallback to cache
      print('❌ Failed to fetch categories from API: $failure');
      return Failure(failure);
    },
  );
}
}

