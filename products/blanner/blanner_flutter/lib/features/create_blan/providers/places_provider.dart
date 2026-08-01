import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/places_repository.dart';
import '../models/place_autocomplete_request.dart';
import '../models/place_prediction.dart';
import '../models/real_place.dart';

/// Provider for places repository
final placesRepositoryProvider = Provider<PlacesRepository>((ref) {
  return PlacesRepository();
});

/// Provider for place autocomplete search
/// Uses a string key to ensure proper caching
/// Format: "query|category|searchType|lat|lng"
final placeAutocompleteProvider =
    FutureProvider.family<List<PlacePrediction>, String>(
  (ref, requestKey) async {
    // Parse the request key back to a request object
    // Format: "query|category|searchType|lat|lng"
    // Note: Empty strings create consecutive pipes (||), so we need to handle that
    final parts = requestKey.split('|');
    
    // Find searchType - it should be "EXACT" or "AREA"
    String? searchTypeStr;
    for (var part in parts) {
      if (part == 'EXACT' || part == 'AREA') {
        searchTypeStr = part;
        break;
      }
    }
    searchTypeStr ??= 'EXACT';
    
    final searchType = searchTypeStr == 'AREA' 
        ? SearchType.area 
        : SearchType.exact;
    
    // Query is always the first part
    final query = parts.isNotEmpty ? parts[0] : '';
    
    // Category is the part before searchType (if any)
    String? category;
    final searchTypeIndex = parts.indexOf(searchTypeStr);
    if (searchTypeIndex > 1) {
      category = parts[1].isNotEmpty ? parts[1] : null;
    }
    
    // Lat and lng are after searchType (if any)
    double? lat;
    double? lng;
    if (searchTypeIndex >= 0 && parts.length > searchTypeIndex + 1) {
      final latStr = parts[searchTypeIndex + 1];
      if (latStr.isNotEmpty && latStr != 'null') {
        lat = double.tryParse(latStr);
      }
    }
    if (searchTypeIndex >= 0 && parts.length > searchTypeIndex + 2) {
      final lngStr = parts[searchTypeIndex + 2];
      if (lngStr.isNotEmpty && lngStr != 'null') {
        lng = double.tryParse(lngStr);
      }
    }
    
    final request = PlaceAutocompleteRequest(
      query: query,
      category: category,
      searchType: searchType,
      lat: lat,
      lng: lng,
    );
    
    print('🚀 placeAutocompleteProvider called with key: $requestKey');
    print('   - Parts: $parts');
    print('   - Query: ${parts[0]}');
    print('   - Category: ${parts.length > 1 ? parts[1] : "null"}');
    print('   - SearchType: ${searchType.toJson()}');
    print('   - Request JSON: ${request.toJson()}');
    final repository = ref.read(placesRepositoryProvider);
    final result = await repository.autocomplete(request);

    return result.when(
      success: (predictions) {
        print('✅ placeAutocompleteProvider success: ${predictions.length} predictions');
        return predictions;
      },
      failure: (failure) {
        print('❌ placeAutocompleteProvider failure: $failure');
        throw failure;
      },
    );
  },
);

/// Provider for place details
final placeDetailsProvider = FutureProvider.family<RealPlace, String>(
  (ref, placeId) async {
    final repository = ref.read(placesRepositoryProvider);
    final result = await repository.getPlaceDetails(placeId);

    return result.when(
      success: (place) => place,
      failure: (failure) {
        throw failure;
      },
    );
  },
);

