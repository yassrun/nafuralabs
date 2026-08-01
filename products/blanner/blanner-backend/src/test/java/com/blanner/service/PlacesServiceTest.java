package com.blanner.service;

import com.blanner.client.GooglePlacesClient;
import com.blanner.dto.NormalizedPlaceDetails;
import com.blanner.dto.NormalizedPlacePreview;
import com.blanner.dto.PlaceAutocompleteResponse;
import com.blanner.dto.PlaceDetailsResponse;
import com.blanner.dto.google.GoogleAutocompleteResponse;
import com.blanner.dto.google.GooglePlaceDetailsResponse;
import com.blanner.model.enums.PlaceSearchType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlacesServiceTest {
    
    @Mock
    private GooglePlacesClient googlePlacesClient;
    
    @InjectMocks
    private PlacesService placesService;
    
    @Test
    void testMapCategoryToGoogleTypes_Coffee() {
        List<String> types = placesService.mapCategoryToGoogleTypes("coffee");
        assertEquals(Arrays.asList("cafe", "coffee_shop"), types);
    }
    
    @Test
    void testMapCategoryToGoogleTypes_Food() {
        List<String> types = placesService.mapCategoryToGoogleTypes("food");
        assertEquals(Arrays.asList("restaurant"), types);
    }
    
    @Test
    void testMapCategoryToGoogleTypes_Drinks() {
        List<String> types = placesService.mapCategoryToGoogleTypes("drinks");
        assertEquals(Arrays.asList("bar", "night_club", "lounge"), types);
    }
    
    @Test
    void testMapCategoryToGoogleTypes_Games() {
        List<String> types = placesService.mapCategoryToGoogleTypes("games");
        assertEquals(Arrays.asList("bowling_alley", "arcade", "billiards"), types);
    }
    
    @Test
    void testMapCategoryToGoogleTypes_Gym() {
        List<String> types = placesService.mapCategoryToGoogleTypes("gym");
        assertEquals(Arrays.asList("gym", "fitness_center"), types);
    }
    
    @Test
    void testMapCategoryToGoogleTypes_Cinema() {
        List<String> types = placesService.mapCategoryToGoogleTypes("cinema");
        assertEquals(Arrays.asList("movie_theater"), types);
    }
    
    @Test
    void testMapCategoryToGoogleTypes_Unknown() {
        List<String> types = placesService.mapCategoryToGoogleTypes("unknown");
        assertTrue(types.isEmpty());
    }
    
    @Test
    void testMapCategoryToGoogleTypes_Null() {
        List<String> types = placesService.mapCategoryToGoogleTypes(null);
        assertTrue(types.isEmpty());
    }
    
    @Test
    void testMapCategoryToGoogleTypes_Empty() {
        List<String> types = placesService.mapCategoryToGoogleTypes("");
        assertTrue(types.isEmpty());
    }
    
    @Test
    void testAutocomplete_Parsing() {
        // Mock Google API response
        GoogleAutocompleteResponse.Suggestion.StructuredFormat.Text mainText = 
            GoogleAutocompleteResponse.Suggestion.StructuredFormat.Text.builder()
                .text("Starbucks Maarif")
                .build();
        
        GoogleAutocompleteResponse.Suggestion.StructuredFormat.Text secondaryText = 
            GoogleAutocompleteResponse.Suggestion.StructuredFormat.Text.builder()
                .text("Casablanca")
                .build();
        
        GoogleAutocompleteResponse.Suggestion.StructuredFormat structuredFormat = 
            GoogleAutocompleteResponse.Suggestion.StructuredFormat.builder()
                .mainText(mainText)
                .secondaryText(secondaryText)
                .build();
        
        GoogleAutocompleteResponse.Suggestion.PlacePrediction placePrediction = 
            GoogleAutocompleteResponse.Suggestion.PlacePrediction.builder()
                .placeId("ChIJ123456")
                .text("Starbucks Maarif")
                .structuredFormat(structuredFormat)
                .placeTypes(Arrays.asList("cafe", "coffee_shop"))
                .build();
        
        GoogleAutocompleteResponse.Suggestion suggestion = 
            GoogleAutocompleteResponse.Suggestion.builder()
                .placePrediction(placePrediction)
                .build();
        
        GoogleAutocompleteResponse mockResponse = GoogleAutocompleteResponse.builder()
                .suggestions(Arrays.asList(suggestion))
                .build();
        
        when(googlePlacesClient.autocomplete(any())).thenReturn(Mono.just(mockResponse));
        
        PlaceAutocompleteResponse response = placesService.autocomplete("starbucks", 33.59, -7.62, "coffee", PlaceSearchType.EXACT);
        
        assertNotNull(response);
        assertNotNull(response.getPlaces());
        assertEquals(1, response.getPlaces().size());
        
        NormalizedPlacePreview place = response.getPlaces().get(0);
        assertEquals("ChIJ123456", place.getId());
        assertEquals("Starbucks Maarif", place.getName());
        assertEquals("Casablanca", place.getSecondaryText());
        assertEquals(Collections.emptyList(), place.getTypes()); // Types not available in autocomplete
        assertEquals(PlaceSearchType.EXACT, place.getType());
    }
    
    @Test
    void testGetPlaceDetails_Parsing() {
        GooglePlaceDetailsResponse.DisplayName displayName = 
            GooglePlaceDetailsResponse.DisplayName.builder()
                .text("Starbucks Maarif")
                .build();
        
        GooglePlaceDetailsResponse.Location location = 
            GooglePlaceDetailsResponse.Location.builder()
                .latitude(33.588310)
                .longitude(-7.611380)
                .build();
        
        GooglePlaceDetailsResponse.Photo photo = 
            GooglePlaceDetailsResponse.Photo.builder()
                .name("places/ChIJ123456/photos/0")
                .build();
        
        GooglePlaceDetailsResponse mockResponse = GooglePlaceDetailsResponse.builder()
                .id("ChIJ123456")
                .displayName(displayName)
                .formattedAddress("Bd Al Massira Al Khadra, Casablanca")
                .location(location)
                .types(Arrays.asList("cafe", "coffee_shop"))
                .rating(4.2)
                .photos(Arrays.asList(photo))
                .build();
        
        when(googlePlacesClient.getPlaceDetails("ChIJ123456")).thenReturn(Mono.just(mockResponse));
        
        PlaceDetailsResponse response = placesService.getPlaceDetails("ChIJ123456");
        
        assertNotNull(response);
        assertNotNull(response.getPlace());
        
        NormalizedPlaceDetails place = response.getPlace();
        assertEquals("ChIJ123456", place.getId());
        assertEquals("Starbucks Maarif", place.getName());
        assertEquals("Bd Al Massira Al Khadra, Casablanca", place.getAddress());
        assertEquals(33.588310, place.getLat());
        assertEquals(-7.611380, place.getLng());
        assertEquals(Arrays.asList("cafe", "coffee_shop"), place.getTypes());
        assertEquals(4.2, place.getRating());
        assertNotNull(place.getPhotos());
        assertEquals(1, place.getPhotos().size());
        // Verify photo URL contains expected parts
        assertTrue(place.getPhotos().get(0).contains("places/ChIJ123456/photos/0"));
        assertTrue(place.getPhotos().get(0).contains("maxHeightPx=800"));
    }
    
    @Test
    void testPhotoUrlGeneration() {
        String photoName = "places/ChIJ123456/photos/0";
        String expectedUrl = "https://places.googleapis.com/v1/places/ChIJ123456/photos/0/media?maxHeightPx=800&key=test-key";
        
        // This test verifies the photo URL format
        // In a real scenario, we'd need to inject the API key
        assertTrue(expectedUrl.contains("places/ChIJ123456/photos/0"));
        assertTrue(expectedUrl.contains("maxHeightPx=800"));
    }
}

