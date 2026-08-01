package com.blanner.client;

import com.blanner.dto.google.GoogleAutocompleteRequest;
import com.blanner.dto.google.GoogleAutocompleteResponse;
import com.blanner.dto.google.GooglePlaceDetailsResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;

@Slf4j
@Component
public class GooglePlacesClient {
    
    private static final String GOOGLE_PLACES_BASE_URL = "https://places.googleapis.com/v1";
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(10);
    
    // Area types for Google Places Autocomplete API
    private static final List<String> AREA_TYPES = List.of(
            "neighborhood",
            "locality",
            "sublocality",
            "administrative_area_level_2"
    );
    
    private final String apiKey;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    
    public GooglePlacesClient(WebClient.Builder webClientBuilder, 
                             @Value("${google.places.apiKey}") String apiKey,
                             ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.objectMapper = objectMapper;
        this.webClient = webClientBuilder
                .baseUrl(GOOGLE_PLACES_BASE_URL)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("X-Goog-Api-Key", apiKey)
                .build();
    }
    
    public Mono<GoogleAutocompleteResponse> autocomplete(GoogleAutocompleteRequest request) {
        log.info("[GOOGLE CLIENT] Calling Google Places Autocomplete API with input: '{}'", request.getInput());
        
        // Log the full request payload
        try {
            String requestPayload = objectMapper.writeValueAsString(request);
            log.info("[GOOGLE CLIENT] Request payload: {}", requestPayload);
        } catch (Exception e) {
            log.warn("[ERROR] Failed to serialize request payload for logging: {}", e.getMessage());
        }
        
        return webClient.post()
                .uri("/places:autocomplete")
                .header("X-Goog-FieldMask", "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(GoogleAutocompleteResponse.class)
                .timeout(REQUEST_TIMEOUT)
                .doOnError(error -> log.error("Error calling Google Places Autocomplete API", error))
                .onErrorMap(this::mapError);
    }
    
    public Mono<GooglePlaceDetailsResponse> getPlaceDetails(String placeId) {
        log.debug("Calling Google Places Details API for placeId: {}", placeId);
        
        String fields = "id,displayName,formattedAddress,location,types,rating,photos";
        
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/places/{placeId}")
                        .queryParam("fields", fields)
                        .build(placeId))
                .retrieve()
                .bodyToMono(GooglePlaceDetailsResponse.class)
                .timeout(REQUEST_TIMEOUT)
                .doOnError(error -> log.error("Error calling Google Places Details API", error))
                .onErrorMap(this::mapError);
    }
    
    /**
     * Gets place details with address components for city extraction.
     * Used for filtering AREA autocomplete results by city.
     */
    public Mono<GooglePlaceDetailsResponse> getPlaceDetailsWithAddressComponents(String placeId) {
        log.debug("Calling Google Places Details API with addressComponents for placeId: {}", placeId);
        
        String fields = "id,addressComponents";
        
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/places/{placeId}")
                        .queryParam("fields", fields)
                        .build(placeId))
                .retrieve()
                .bodyToMono(GooglePlaceDetailsResponse.class)
                .timeout(REQUEST_TIMEOUT)
                .doOnError(error -> log.error("Error calling Google Places Details API with addressComponents", error))
                .onErrorMap(this::mapError);
    }
    
    public String getPhotoUrl(String photoName, int maxHeightPx) {
        // photoName format: places/{placeId}/photos/{photoId}
        return String.format("%s/%s/media?maxHeightPx=%d&key=%s", 
                GOOGLE_PLACES_BASE_URL, photoName, maxHeightPx, apiKey);
    }
    
    /**
     * Returns the list of Google Places types for area search.
     * Used when searchType is AREA to filter for neighborhoods, localities, etc.
     */
    public static List<String> getAreaTypes() {
        return AREA_TYPES;
    }
    
    private Throwable mapError(Throwable error) {
        if (error instanceof WebClientResponseException) {
            WebClientResponseException ex = (WebClientResponseException) error;
            HttpStatusCode statusCode = ex.getStatusCode();
            HttpStatus status = HttpStatus.resolve(statusCode.value());
            
            // Log the full response body for debugging
            String responseBody = ex.getResponseBodyAsString();
            log.error("Google Places API error response: {}", responseBody);
            
            if (status == null) {
                return new GooglePlacesException("Unknown HTTP status: " + statusCode.value(), HttpStatus.SERVICE_UNAVAILABLE);
            }
            
            if (status == HttpStatus.TOO_MANY_REQUESTS) {
                return new GooglePlacesException("Google Places API quota exceeded", HttpStatus.TOO_MANY_REQUESTS);
            } else if (status.is4xxClientError()) {
                String errorMessage = responseBody != null && !responseBody.isEmpty() 
                    ? responseBody 
                    : ex.getMessage();
                return new GooglePlacesException("Invalid request to Google Places API: " + errorMessage, HttpStatus.BAD_REQUEST);
            } else if (status.is5xxServerError()) {
                return new GooglePlacesException("Google Places API server error", HttpStatus.SERVICE_UNAVAILABLE);
            }
        }
        
        // Network or timeout errors
        if (error instanceof java.util.concurrent.TimeoutException) {
            return new GooglePlacesException("Google Places API timeout", HttpStatus.SERVICE_UNAVAILABLE);
        }
        
        return new GooglePlacesException("Error calling Google Places API: " + error.getMessage(), HttpStatus.SERVICE_UNAVAILABLE);
    }
    
    public static class GooglePlacesException extends RuntimeException {
        private final HttpStatus httpStatus;
        
        public GooglePlacesException(String message, HttpStatus httpStatus) {
            super(message);
            this.httpStatus = httpStatus;
        }
        
        public HttpStatus getHttpStatus() {
            return httpStatus;
        }
    }
}

