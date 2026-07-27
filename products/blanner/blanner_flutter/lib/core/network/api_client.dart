import 'dart:convert';
import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../error/failures.dart';
import '../utils/result.dart';

/// API client for making HTTP requests to the backend
class ApiClient {
  final String baseUrl;
  final Map<String, String> defaultHeaders;

  ApiClient({
    String? baseUrl,
    Map<String, String>? defaultHeaders,
  })  : baseUrl = baseUrl ?? ApiConfig.baseUrl,
        defaultHeaders = defaultHeaders ?? ApiConfig.defaultHeaders;

  /// GET request
  Future<Result<Map<String, dynamic>>> get(
    String endpoint, {
    Map<String, String>? headers,
    Map<String, String>? queryParameters,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl$endpoint').replace(
        queryParameters: queryParameters,
      );

      print('🌐 GET Request: $uri');
      final response = await http.get(
        uri,
        headers: {...defaultHeaders, ...?headers},
      );

      print('📥 Raw response status: ${response.statusCode}');
      print('📥 Raw response body (first 500 chars): ${response.body.length > 500 ? "${response.body.substring(0, 500)}..." : response.body}');

      return _handleResponse(response);
    } catch (e) {
      return Failure(
        NetworkFailure('Network error: ${e.toString()}'),
      );
    }
  }

  /// POST request
  Future<Result<Map<String, dynamic>>> post(
    String endpoint, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl$endpoint');
      
      // Debug logging
      print('🌐 API POST Request: $uri');
      if (body != null) {
        print('📤 Request body: ${jsonEncode(body)}');
      }

      final response = await http.post(
        uri,
        headers: {...defaultHeaders, ...?headers},
        body: body != null ? jsonEncode(body) : null,
      );

      print('📥 Response status: ${response.statusCode}');
      print('📥 Response body: ${response.body}');

      return _handleResponse(response);
    } catch (e, stackTrace) {
      print('❌ Network error: $e');
      print('❌ Stack trace: $stackTrace');
      return Failure(
        NetworkFailure('Network error: ${e.toString()}'),
      );
    }
  }

  /// PUT request
  Future<Result<Map<String, dynamic>>> put(
    String endpoint, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl$endpoint');

      final response = await http.put(
        uri,
        headers: {...defaultHeaders, ...?headers},
        body: body != null ? jsonEncode(body) : null,
      );

      return _handleResponse(response);
    } catch (e) {
      return Failure(
        NetworkFailure('Network error: ${e.toString()}'),
      );
    }
  }

  /// DELETE request
  Future<Result<Map<String, dynamic>>> delete(
    String endpoint, {
    Map<String, String>? headers,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl$endpoint');

      final response = await http.delete(
        uri,
        headers: {...defaultHeaders, ...?headers},
      );

      return _handleResponse(response);
    } catch (e) {
      return Failure(
        NetworkFailure('Network error: ${e.toString()}'),
      );
    }
  }

  /// Handle HTTP response
  Result<Map<String, dynamic>> _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      try {
        final decoded = jsonDecode(response.body);
        print('✅ Decoded response: $decoded');
        // Handle both object and array responses
        if (decoded is Map<String, dynamic>) {
          return Success(decoded);
        } else if (decoded is List) {
          // Wrap array in a map for consistent handling
          return Success({'data': decoded});
        } else {
          print('⚠️ Unexpected response type: ${decoded.runtimeType}');
          return Success({});
        }
      } catch (e, stackTrace) {
        print('❌ JSON decode error: $e');
        print('❌ Response body: ${response.body}');
        print('❌ Stack trace: $stackTrace');
        // If response is not JSON, return empty map
        return Success({});
      }
    } else {
      print('❌ HTTP error: ${response.statusCode}');
      print('❌ Response body: ${response.body}');
      
      // Try to extract error message from response
      String errorMessage = 'Request failed with status ${response.statusCode}';
      try {
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic>) {
          // Try common error message fields
          final message = decoded['message'] ?? 
                         decoded['error'] ?? 
                         decoded['errorMessage'] ??
                         decoded['detail'];
          if (message != null) {
            errorMessage = message.toString();
          } else {
            errorMessage = response.body;
          }
        }
      } catch (e) {
        // If parsing fails, use the raw body
        errorMessage = response.body;
      }
      
      return Failure(
        NetworkFailure(
          errorMessage,
          code: response.statusCode.toString(),
        ),
      );
    }
  }
}

