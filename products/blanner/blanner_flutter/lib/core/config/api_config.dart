/// API configuration for backend communication
class ApiConfig {
  /// Override with --dart-define=API_BASE_URL=...
  /// Android emulator default: http://10.0.2.2:8080/api
  /// iOS simulator / Chrome: http://localhost:8080/api
  /// Staging API (pods): http://api.blanner.nafuralabs.staging/api
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8080/api',
  );

  static const String categoriesEndpoint = '/categories';

  static Map<String, String> get defaultHeaders => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
}
