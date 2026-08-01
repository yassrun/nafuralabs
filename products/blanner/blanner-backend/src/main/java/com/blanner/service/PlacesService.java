package com.blanner.service;

import com.blanner.categories.Category;
import com.blanner.categories.CategoryRepository;
import com.blanner.client.GooglePlacesClient;
import com.blanner.dto.NormalizedPlaceDetails;
import com.blanner.dto.NormalizedPlacePreview;
import com.blanner.dto.PlaceAutocompleteResponse;
import com.blanner.dto.PlaceDetailsResponse;
import com.blanner.dto.google.GoogleAutocompleteRequest;
import com.blanner.dto.google.GoogleAutocompleteResponse;
import com.blanner.dto.google.GooglePlaceDetailsResponse;
import com.blanner.model.enums.PlaceSearchType;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlacesService {
    
    private final GooglePlacesClient googlePlacesClient;
    private final CategoryRepository categoryRepository;
    private final ObjectMapper objectMapper;
    
    // Cache for city extraction to avoid repeated API calls
    private final Map<String, String> cityCache = new ConcurrentHashMap<>();
    
    @Cacheable(value = "placeAutocomplete", key = "(#query != null ? #query : 'empty') + '_' + #lat + '_' + #lng + '_' + (#category != null ? #category : 'none') + '_' + (#searchType != null ? #searchType : 'EXACT')")
    public PlaceAutocompleteResponse autocomplete(String query, Double lat, Double lng, String category, PlaceSearchType searchType) {
        log.info("[AUTOCOMPLETE] Request received: query='{}', lat={}, lng={}, category='{}', searchType='{}'", 
                query, lat, lng, category, searchType);
        
        // Validate query - Google Places API requires non-empty input
        if (query == null || query.trim().isEmpty()) {
            log.warn("[VALIDATION] FAILED: Query cannot be empty");
            throw new IllegalArgumentException("Query cannot be empty. Google Places API requires a non-empty input.");
        }
        
        // Validate searchType - default to EXACT if not provided
        if (searchType == null) {
            searchType = PlaceSearchType.EXACT;
            log.info("[VALIDATION] searchType not provided, defaulting to EXACT");
        }
        
        GoogleAutocompleteRequest request = buildAutocompleteRequest(query, lat, lng, category, searchType);
        
        // Log the full request payload
        try {
            String requestPayload = objectMapper.writeValueAsString(request);
            log.info("[GOOGLE API] Request payload: {}", requestPayload);
        } catch (Exception e) {
            log.warn("[ERROR] Failed to serialize request payload for logging: {}", e.getMessage());
        }
        
        GoogleAutocompleteResponse response = googlePlacesClient.autocomplete(request)
                .block(); // Blocking call since we're in a non-reactive context
        
        PlaceAutocompleteResponse normalizedResponse = mapToNormalizedResponse(response, searchType);
        
        // Filter AREA results by city (only apply to AREA search type)
        if (searchType == PlaceSearchType.AREA) {
            normalizedResponse = filterAreasByCity(normalizedResponse);
        }
        
        log.info("[SUCCESS] Autocomplete response: {} places found", normalizedResponse.getPlaces().size());
        
        return normalizedResponse;
    }
    
    @Cacheable(value = "placeDetails", key = "#placeId")
    public PlaceDetailsResponse getPlaceDetails(String placeId) {
        log.debug("Place details request for placeId: {}", placeId);
        
        GooglePlaceDetailsResponse response = googlePlacesClient.getPlaceDetails(placeId)
                .block(); // Blocking call since we're in a non-reactive context
        
        return PlaceDetailsResponse.builder()
                .place(mapToNormalizedDetails(response, placeId))
                .build();
    }
    
    public List<String> mapCategoryToGoogleTypes(String category) {
        if (category == null || category.isEmpty()) {
            log.debug("Category is null or empty, returning empty Google types list");
            return Collections.emptyList();
        }
        
        // Find category by name (case-insensitive match)
        Optional<Category> categoryOpt = categoryRepository.findByName(category);
        
        if (categoryOpt.isEmpty()) {
            log.warn("[WARNING] Category not found in database: '{}'", category);
            return Collections.emptyList();
        }
        
        Category foundCategory = categoryOpt.get();
        List<String> googleTags = foundCategory.getGoogleTags();
        
        log.debug("Found category: {} (id: {}), googleTags: {}", foundCategory.getName(), foundCategory.getId(), googleTags);
        
        // Return googleTags if available, otherwise empty list
        return (googleTags != null && !googleTags.isEmpty()) 
            ? googleTags 
            : Collections.emptyList();
    }
    
    private GoogleAutocompleteRequest buildAutocompleteRequest(String query, Double lat, Double lng, String category, PlaceSearchType searchType) {
        List<String> includedPrimaryTypes = getPrimaryTypesForSearchType(category, searchType);
        log.info("[SEARCH TYPE] '{}' with category '{}' mapped to Google types: {}", searchType, category, includedPrimaryTypes);
        
        // Query is already validated to be non-empty in autocomplete() method
        GoogleAutocompleteRequest.GoogleAutocompleteRequestBuilder builder = GoogleAutocompleteRequest.builder()
                .input(query.trim())
                .languageCode("en")
                .regionCode("MA");
        
        // Add location bias if lat/lng are provided
        if (lat != null && lng != null) {
            GoogleAutocompleteRequest.LocationBias.Circle.Center center = 
                GoogleAutocompleteRequest.LocationBias.Circle.Center.builder()
                    .latitude(lat)
                    .longitude(lng)
                    .build();
            
            GoogleAutocompleteRequest.LocationBias.Circle circle = 
                GoogleAutocompleteRequest.LocationBias.Circle.builder()
                    .center(center)
                    .radius(5000.0)
                    .build();
            
            GoogleAutocompleteRequest.LocationBias locationBias = 
                GoogleAutocompleteRequest.LocationBias.builder()
                    .circle(circle)
                    .build();
            
            builder.locationBias(locationBias);
        }
        
        // Add primary types filter based on search type
        if (!includedPrimaryTypes.isEmpty()) {
            builder.includedPrimaryTypes(includedPrimaryTypes);
        }
        
        return builder.build();
    }
    
    /**
     * Returns the appropriate Google Places types based on the search type.
     * - EXACT: Uses category mapping (establishment types)
     * - AREA: Uses area types (neighborhood, locality, etc.)
     */
    private List<String> getPrimaryTypesForSearchType(String category, PlaceSearchType searchType) {
        switch (searchType) {
            case EXACT:
                return mapCategoryToGoogleTypes(category);
            case AREA:
                return GooglePlacesClient.getAreaTypes();
            default:
                log.warn("[WARNING] Unknown searchType: {}, defaulting to EXACT", searchType);
                return mapCategoryToGoogleTypes(category);
        }
    }
    
    private PlaceAutocompleteResponse mapToNormalizedResponse(GoogleAutocompleteResponse response, PlaceSearchType searchType) {
        if (response == null || response.getSuggestions() == null) {
            return PlaceAutocompleteResponse.builder()
                    .places(Collections.emptyList())
                    .build();
        }
        
        List<NormalizedPlacePreview> places = response.getSuggestions().stream()
                .filter(suggestion -> suggestion.getPlacePrediction() != null)
                .map(suggestion -> {
                    GoogleAutocompleteResponse.Suggestion.PlacePrediction prediction = suggestion.getPlacePrediction();
                    
                    String name = prediction.getStructuredFormat() != null && 
                                 prediction.getStructuredFormat().getMainText() != null
                            ? prediction.getStructuredFormat().getMainText().getText()
                            : (prediction.getText() != null ? prediction.getText().getText() : "");
                    
                    String secondaryText = prediction.getStructuredFormat() != null && 
                                          prediction.getStructuredFormat().getSecondaryText() != null
                            ? prediction.getStructuredFormat().getSecondaryText().getText()
                            : "";
                    
                    // Note: placeTypes is not available in autocomplete response
                    // Types will be empty for autocomplete, but can be fetched from place details
                    return NormalizedPlacePreview.builder()
                            .id(prediction.getPlaceId())
                            .name(name)
                            .secondaryText(secondaryText)
                            .types(Collections.emptyList()) // Types not available in autocomplete
                            .type(searchType) // Set the search type for the response
                            .build();
                })
                .collect(Collectors.toList());
        
        return PlaceAutocompleteResponse.builder()
                .places(places)
                .build();
    }
    
    /**
     * Filters AREA autocomplete results to only include neighborhoods in the user's city.
     * Currently hardcoded to "Casablanca" until authentication is implemented.
     */
    private PlaceAutocompleteResponse filterAreasByCity(PlaceAutocompleteResponse response) {
        final String userCity = "Casablanca";
        
        if (response == null || response.getPlaces() == null || response.getPlaces().isEmpty()) {
            return response;
        }
        
        List<NormalizedPlacePreview> filteredPlaces = response.getPlaces().stream()
                .filter(place -> {
                    // First check: secondaryText contains city name (case-insensitive)
                    if (place.getSecondaryText() != null) {
                        String secondaryTextLower = place.getSecondaryText().toLowerCase();
                        if (secondaryTextLower.contains(userCity.toLowerCase())) {
                            log.debug("[CITY FILTER] Keeping area '{}' - found city in secondaryText", place.getName());
                            return true;
                        }
                    }
                    
                    // Second check: Fetch place details to get city from address components
                    try {
                        String city = extractCityFromPlaceDetails(place.getId());
                        if (city != null && city.equalsIgnoreCase(userCity)) {
                            log.debug("[CITY FILTER] Keeping area '{}' - city from place details: {}", place.getName(), city);
                            return true;
                        } else {
                            log.debug("[CITY FILTER] Filtered out area '{}' because city '{}' != Casablanca", place.getName(), city);
                            return false;
                        }
                    } catch (Exception e) {
                        log.warn("[CITY FILTER] Error fetching place details for '{}' (placeId: {}): {}. Filtering out.", 
                                place.getName(), place.getId(), e.getMessage());
                        return false;
                    }
                })
                .collect(Collectors.toList());
        
        return PlaceAutocompleteResponse.builder()
                .places(filteredPlaces)
                .build();
    }
    
    /**
     * Extracts city name from place details address components.
     * Looks for locality or administrative_area_level_2.
     * Results are cached to avoid repeated API calls.
     */
    private String extractCityFromPlaceDetails(String placeId) {
        // Check cache first
        if (cityCache.containsKey(placeId)) {
            log.debug("[CITY EXTRACTION] Using cached city for placeId: {}", placeId);
            return cityCache.get(placeId);
        }
        
        try {
            GooglePlaceDetailsResponse detailsResponse = googlePlacesClient
                    .getPlaceDetailsWithAddressComponents(placeId)
                    .block();
            
            if (detailsResponse == null || detailsResponse.getAddressComponents() == null) {
                log.debug("[CITY EXTRACTION] No address components found for placeId: {}", placeId);
                cityCache.put(placeId, null); // Cache null to avoid repeated API calls
                return null;
            }
            
            // Look for locality or administrative_area_level_2
            for (GooglePlaceDetailsResponse.AddressComponent component : detailsResponse.getAddressComponents()) {
                if (component.getTypes() != null) {
                    for (String type : component.getTypes()) {
                        if ("locality".equals(type) || "administrative_area_level_2".equals(type)) {
                            String city = component.getLongText() != null ? component.getLongText() : component.getShortText();
                            log.debug("[CITY EXTRACTION] Found city '{}' for placeId: {} (type: {})", city, placeId, type);
                            cityCache.put(placeId, city); // Cache the result
                            return city;
                        }
                    }
                }
            }
            
            log.debug("[CITY EXTRACTION] No city found in address components for placeId: {}", placeId);
            cityCache.put(placeId, null); // Cache null to avoid repeated API calls
            return null;
        } catch (Exception e) {
            log.error("[CITY EXTRACTION] Error extracting city for placeId {}: {}", placeId, e.getMessage());
            cityCache.put(placeId, null); // Cache null on error to avoid repeated failed calls
            return null;
        }
    }
    
    private NormalizedPlaceDetails mapToNormalizedDetails(GooglePlaceDetailsResponse response, String placeId) {
        if (response == null) {
            return null;
        }
        
        String name = response.getDisplayName() != null 
                ? response.getDisplayName().getText() 
                : "";
        
        Double lat = response.getLocation() != null 
                ? response.getLocation().getLatitude() 
                : null;
        
        Double lng = response.getLocation() != null 
                ? response.getLocation().getLongitude() 
                : null;
        
        List<String> photoUrls = Collections.emptyList();
        if (response.getPhotos() != null && !response.getPhotos().isEmpty()) {
            photoUrls = response.getPhotos().stream()
                    .map(photo -> googlePlacesClient.getPhotoUrl(photo.getName(), 800))
                    .collect(Collectors.toList());
        }
        
        return NormalizedPlaceDetails.builder()
                .id(placeId)
                .name(name)
                .address(response.getFormattedAddress())
                .lat(lat)
                .lng(lng)
                .types(response.getTypes() != null ? response.getTypes() : Collections.emptyList())
                .rating(response.getRating())
                .photos(photoUrls)
                .build();
    }
}

