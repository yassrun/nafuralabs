/// API configuration for backend communication
class ApiConfig {
  // Base URL for the backend API
  // For Android emulator: use 10.0.2.2 instead of localhost
  // For iOS simulator: use localhost
  // For physical device: use your computer's IP address
  static const String baseUrl = 'http://10.0.2.2:8080/api';
  
  // Alternative URLs (uncomment based on your setup):
  // static const String baseUrl = 'http://localhost:8080/api'; // iOS Simulator
  // static const String baseUrl = 'http://192.168.1.X:8080/api'; // Physical device (replace X with your IP)

  // API endpoints
  static const String categoriesEndpoint = '/categories';
  
  // Headers
  static Map<String, String> get defaultHeaders => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
}

