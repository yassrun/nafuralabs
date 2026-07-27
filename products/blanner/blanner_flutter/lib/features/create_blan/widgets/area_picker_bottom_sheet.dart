import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../design_system/colors.dart';
import '../../../../design_system/radius.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../models/area.dart';
import '../models/category.dart';
import '../models/place_prediction.dart';
import '../providers/places_provider.dart';

/// Area picker bottom sheet with Google Places Autocomplete for areas
class AreaPickerBottomSheet extends ConsumerStatefulWidget {
  final Category? category;
  
  const AreaPickerBottomSheet({
    super.key,
    this.category,
  });

  @override
  ConsumerState<AreaPickerBottomSheet> createState() =>
      _AreaPickerBottomSheetState();
}

class _AreaPickerBottomSheetState extends ConsumerState<AreaPickerBottomSheet> {
  final _searchController = TextEditingController();
  Timer? _debounceTimer;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    // No initial results - wait for user to type
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      setState(() {
        _searchQuery = value.trim();
      });
    });
  }

  Future<void> _selectArea(PlacePrediction prediction) async {
    // Convert PlacePrediction to Area
    // Note: We'll need to get coordinates from place details or use prediction data
    // For now, create an Area from the prediction
    final area = Area(
      id: prediction.id,
      name: prediction.name,
      latitude: 0.0, // TODO: Get from place details if needed
      longitude: 0.0, // TODO: Get from place details if needed
      isNeighborhood: true,
    );

    if (mounted) {
      Navigator.pop(context, area);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      decoration: const BoxDecoration(
        color: BlannerColors.background,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(BlannerRadius.large),
        ),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: BlannerSpacing.sm),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: BlannerColors.textSecondary.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.all(BlannerSpacing.lg),
            child: Row(
              children: [
                Text(
                  'Choose an area',
                  style: BlannerTextStyles.headline2,
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          // Search field
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: BlannerSpacing.lg),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search neighborhoods, areas...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(BlannerRadius.medium),
                ),
              ),
              onChanged: _onSearchChanged,
            ),
          ),
          const SizedBox(height: BlannerSpacing.md),
          // Areas list
          Expanded(
            child: _buildAreasList(),
          ),
        ],
      ),
    );
  }

  Widget _buildAreasList() {
    // Don't search if query is too short
    if (_searchQuery.length < 2) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(BlannerSpacing.lg),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.search,
                size: 64,
                color: BlannerColors.textSecondary.withValues(alpha: 0.5),
              ),
              const SizedBox(height: BlannerSpacing.md),
              Text(
                'Start typing to search for areas',
                style: BlannerTextStyles.body2.copyWith(
                  color: BlannerColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Create a stable key for the provider
    // Format: "query|category|searchType|lat|lng"
    // API requires lat, lng, and category for AREA searches
    final searchType = 'AREA'; // Always AREA for area picker
    final categoryValue = widget.category?.name ?? 'coffee'; // Default to 'coffee' if no category
    // Use Casablanca coordinates as default (33.5731, -7.5898)
    // TODO: Get user's actual location or use city-based coordinates
    final lat = '33.5731'; // Default to Casablanca
    final lng = '-7.5898'; // Default to Casablanca
    final requestKey = '$_searchQuery|$categoryValue|$searchType|$lat|$lng';
    
    print('🔑 Area picker request key: $requestKey');
    print('   - Query: $_searchQuery');
    print('   - Category: $categoryValue');
    print('   - SearchType: $searchType');
    print('   - Lat: $lat, Lng: $lng');

    final predictionsAsync = ref.watch(placeAutocompleteProvider(requestKey));

    return predictionsAsync.when(
      data: (predictions) {
        if (predictions.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(BlannerSpacing.lg),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.location_off,
                    size: 64,
                    color: BlannerColors.textSecondary.withValues(alpha: 0.5),
                  ),
                  const SizedBox(height: BlannerSpacing.md),
                  Text(
                    'No areas found',
                    style: BlannerTextStyles.body2.copyWith(
                      color: BlannerColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.symmetric(horizontal: BlannerSpacing.lg),
          itemCount: predictions.length,
          itemBuilder: (context, index) {
            final prediction = predictions[index];
            return ListTile(
              leading: Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: BlannerColors.surface,
                  borderRadius: BorderRadius.circular(BlannerRadius.small),
                ),
                child: const Icon(Icons.location_city),
              ),
              title: Text(
                prediction.name,
                style: BlannerTextStyles.body1.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              subtitle: prediction.secondaryText != null
                  ? Text(
                      prediction.secondaryText!,
                      style: BlannerTextStyles.caption,
                    )
                  : null,
              onTap: () => _selectArea(prediction),
            );
          },
        );
      },
      loading: () => const Center(
        child: Padding(
          padding: EdgeInsets.all(BlannerSpacing.lg),
          child: CircularProgressIndicator(),
        ),
      ),
      error: (error, stackTrace) => Center(
        child: Padding(
          padding: const EdgeInsets.all(BlannerSpacing.lg),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 64,
                color: BlannerColors.error,
              ),
              const SizedBox(height: BlannerSpacing.md),
              Text(
                'Failed to load areas',
                style: BlannerTextStyles.body1.copyWith(
                  color: BlannerColors.error,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: BlannerSpacing.xs),
              Text(
                error.toString(),
                style: BlannerTextStyles.caption.copyWith(
                  color: BlannerColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: BlannerSpacing.md),
              TextButton(
                onPressed: () {
                  // Recreate the request key for retry
                  final categoryValue = widget.category?.name ?? 'coffee';
                  final lat = '33.5731';
                  final lng = '-7.5898';
                  final requestKey = '$_searchQuery|$categoryValue|AREA|$lat|$lng';
                  ref.invalidate(placeAutocompleteProvider(requestKey));
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

