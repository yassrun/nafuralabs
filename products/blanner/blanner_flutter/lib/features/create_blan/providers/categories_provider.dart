import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/categories_repository.dart';
import '../models/category.dart';

/// Provider for categories repository
final categoriesRepositoryProvider = Provider<CategoriesRepository>((ref) {
  return CategoriesRepository();
});

/// Provider for fetching categories from backend
/// Uses cache to avoid unnecessary API calls
final categoriesProvider = FutureProvider<List<Category>>((ref) async {
  final repository = ref.read(categoriesRepositoryProvider);
  final result = await repository.getCategories(forceRefresh: false);

  return result.when(
    success: (categories) => categories,
    failure: (failure) {
      // Throw error to be handled by FutureProvider
      throw failure;
    },
  );
});

/// Provider for force refreshing categories (bypasses cache)
final refreshCategoriesProvider = FutureProvider<List<Category>>((ref) async {
  final repository = ref.read(categoriesRepositoryProvider);
  final result = await repository.getCategories(forceRefresh: true);

  return result.when(
    success: (categories) => categories,
    failure: (failure) {
      // Throw error to be handled by FutureProvider
      throw failure;
    },
  );
});

