import 'place_prediction.dart';

/// Response model for place autocomplete API
class PlaceAutocompleteResponse {
  final List<PlacePrediction> predictions;

  const PlaceAutocompleteResponse({
    required this.predictions,
  });

  factory PlaceAutocompleteResponse.fromJson(Map<String, dynamic> json) {
    final predictionsList = json['predictions'] as List<dynamic>? ?? [];
    return PlaceAutocompleteResponse(
      predictions: predictionsList
          .map((item) => PlacePrediction.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}

