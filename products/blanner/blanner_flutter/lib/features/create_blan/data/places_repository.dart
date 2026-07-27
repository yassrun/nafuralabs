import '../../../core/network/api_client.dart';
import '../../../core/error/failures.dart';
import '../../../core/utils/result.dart';
import '../models/place_autocomplete_request.dart';
import '../models/place_prediction.dart';
import '../models/real_place.dart';

/// Repository for fetching places from the backend Google Places API
class PlacesRepository {
  final ApiClient apiClient;

  PlacesRepository({ApiClient? apiClient})
      : apiClient = apiClient ?? ApiClient();

  /// Search for places using autocomplete
  Future<Result<List<PlacePrediction>>> autocomplete(
    PlaceAutocompleteRequest request,
  ) async {
    final payload = request.toJson();
    print('🔍 PlacesRepository.autocomplete called');
    print('📦 Autocomplete API Payload: $payload');
    
    final result = await apiClient.post(
      '/places/autocomplete',
      body: payload,
    );

    return result.when(
      success: (json) {
        print('📦 PlacesRepository received JSON: $json');
        print('📦 JSON keys: ${json.keys.toList()}');
        
        try {
          // Backend returns {"places": [...]}
          List<dynamic> predictionsList;
          if (json.containsKey('places') && json['places'] is List) {
            predictionsList = json['places'] as List<dynamic>;
            print('✅ Found "places" key with ${predictionsList.length} items');
          } else if (json.containsKey('predictions') && json['predictions'] is List) {
            // Fallback for alternative response format
            predictionsList = json['predictions'] as List<dynamic>;
            print('✅ Found "predictions" key with ${predictionsList.length} items');
          } else if (json.containsKey('data') && json['data'] is List) {
            // Fallback if wrapped by ApiClient
            predictionsList = json['data'] as List<dynamic>;
            print('✅ Found "data" key with ${predictionsList.length} items');
          } else {
            print('⚠️ No known list key found, searching for any list...');
            // Try to find any list in the response
            try {
              final firstList = json.values.firstWhere(
                (value) => value is List,
                orElse: () => <dynamic>[],
              );
              predictionsList = firstList as List<dynamic>;
              print('✅ Found list in response with ${predictionsList.length} items');
            } catch (e) {
              print('❌ No list found in response');
              predictionsList = <dynamic>[];
            }
          }

          print('📋 Parsing ${predictionsList.length} predictions...');
          final predictions = <PlacePrediction>[];
          for (var i = 0; i < predictionsList.length; i++) {
            final item = predictionsList[i];
            try {
              if (item is Map<String, dynamic>) {
                print('  📍 Parsing item $i: $item');
                predictions.add(PlacePrediction.fromJson(item));
              } else {
                print('  ⚠️ Item $i is not a Map: ${item.runtimeType}');
              }
            } catch (e, stackTrace) {
              print('  ❌ Error parsing item $i: $e');
              print('  ❌ Stack trace: $stackTrace');
              // Skip invalid items
              continue;
            }
          }

          print('✅ Successfully parsed ${predictions.length} predictions');
          return Success(predictions);
        } catch (e, stackTrace) {
          print('❌ Failed to parse autocomplete response: $e');
          print('❌ Stack trace: $stackTrace');
          return Failure(
            NetworkFailure('Failed to parse autocomplete response: ${e.toString()}'),
          );
        }
      },
      failure: (failure) {
        print('❌ PlacesRepository received failure: $failure');
        return Failure(failure);
      },
    );
  }

  /// Get place details by place ID
  Future<Result<RealPlace>> getPlaceDetails(String placeId) async {
    final result = await apiClient.get('/places/details/$placeId');

    return result.when(
      success: (json) {
        try {
          // Backend returns {"place": {...}}
          final placeJson = json['place'] as Map<String, dynamic>?;
          if (placeJson == null) {
            return Failure(
              NetworkFailure('Place not found'),
            );
          }

          final place = RealPlace.fromJson(placeJson);
          return Success(place);
        } catch (e) {
          return Failure(
            NetworkFailure('Failed to parse place details: ${e.toString()}'),
          );
        }
      },
      failure: (failure) => Failure(failure),
    );
  }
}

