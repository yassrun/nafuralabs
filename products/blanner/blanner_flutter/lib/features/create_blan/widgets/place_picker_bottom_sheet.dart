import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../design_system/colors.dart';
import '../../../../design_system/radius.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../models/category.dart';
import '../models/place_prediction.dart';
import '../providers/places_provider.dart';

/// Place picker bottom sheet with Google Places Autocomplete
class PlacePickerBottomSheet extends ConsumerStatefulWidget {
  final Category category;

  const PlacePickerBottomSheet({
    super.key,
    required this.category,
  });

  @override
  ConsumerState<PlacePickerBottomSheet> createState() =>
      _PlacePickerBottomSheetState();
}

class _PlacePickerBottomSheetState
    extends ConsumerState<PlacePickerBottomSheet> {
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

  Future<void> _selectPlace(PlacePrediction prediction) async {
    // Show loading indicator
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(),
      ),
    );

    try {
      // Fetch place details
      final place = await ref.read(
        placeDetailsProvider(prediction.placeId).future,
      );

      if (mounted) {
        Navigator.pop(context); // Close loading dialog
        Navigator.pop(context, place); // Return selected place
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context); // Close loading dialog
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load place details: ${e.toString()}'),
            backgroundColor: BlannerColors.error,
          ),
        );
      }
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
                  'Choose a place',
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
                hintText: 'Search places...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(BlannerRadius.medium),
                ),
              ),
              onChanged: _onSearchChanged,
            ),
          ),
          const SizedBox(height: BlannerSpacing.md),
          // Places list
          Expanded(
            child: _buildPlacesList(),
          ),
        ],
      ),
    );
  }

  Widget _buildPlacesList() {
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
                'Start typing to search for places',
                style: BlannerTextStyles.body2.copyWith(
                  color: BlannerColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Create a stable key for the provider to ensure proper caching
    // Format: "query|category|searchType|lat|lng"
    final categoryValue = widget.category.name; // Use category name when user types
    final searchType = 'EXACT'; // Always EXACT for place picker
    final lat = ''; // No lat for place search
    final lng = ''; // No lng for place search
    final requestKey = '$_searchQuery|$categoryValue|$searchType|$lat|$lng';
    
    print('🔑 Place picker request key: $requestKey');
    print('   - Query: $_searchQuery');
    print('   - Category: $categoryValue');
    print('   - SearchType: $searchType');

    final predictionsAsync = ref.watch(placeAutocompleteProvider(requestKey));

    // Debug logging
    predictionsAsync.when(
      data: (predictions) {
        print('🎨 UI: Received ${predictions.length} predictions');
      },
      loading: () {
        print('🎨 UI: Still loading...');
      },
      error: (error, stack) {
        print('🎨 UI: Error: $error');
      },
    );

    return predictionsAsync.when(
      data: (predictions) {
        print('🎨 UI: Building list with ${predictions.length} items');
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
                    'No places found',
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
                child: const Icon(Icons.place),
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
              onTap: () => _selectPlace(prediction),
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
                'Failed to load places',
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
                  final requestKey = '$_searchQuery|${widget.category.name}|EXACT||';
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

