package com.blanner.controller;

import com.blanner.client.GooglePlacesClient;
import com.blanner.dto.NormalizedPlaceDetails;
import com.blanner.dto.PlaceAutocompleteRequest;
import com.blanner.dto.PlaceAutocompleteResponse;
import com.blanner.dto.PlaceDetailsResponse;
import com.blanner.service.PlacesService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/places")
@RequiredArgsConstructor
@Tag(name = "Places", description = "Google Places API integration endpoints")
public class PlacesController {
    
    private final PlacesService placesService;
    private final GooglePlacesClient googlePlacesClient;
    
    @PostMapping("/autocomplete")
    @Operation(
            summary = "Place autocomplete", 
            description = "Search for places or areas using Google Places Autocomplete API. " +
                         "Supports two search modes: " +
                         "1. EXACT: Search for establishments (cafés, restaurants, etc.) based on category. " +
                         "2. AREA: Search for neighborhoods, localities, and administrative areas. " +
                         "If searchType is not provided, defaults to EXACT."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Autocomplete results retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request"),
            @ApiResponse(responseCode = "429", description = "Google API quota exceeded"),
            @ApiResponse(responseCode = "503", description = "Google API unavailable")
    })
    public ResponseEntity<?> autocomplete(@Valid @RequestBody PlaceAutocompleteRequest request) {
        try {
            PlaceAutocompleteResponse response = placesService.autocomplete(
                    request.getQuery(), 
                    request.getLat(), 
                    request.getLng(), 
                    request.getCategory(),
                    request.getSearchType()
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (GooglePlacesClient.GooglePlacesException e) {
            return ResponseEntity.status(e.getHttpStatus())
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }
    
    @GetMapping("/details/{placeId}")
    @Operation(summary = "Place details", description = "Get detailed information about a place using Google Places API")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Place details retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid place ID"),
            @ApiResponse(responseCode = "429", description = "Google API quota exceeded"),
            @ApiResponse(responseCode = "503", description = "Google API unavailable")
    })
    public ResponseEntity<PlaceDetailsResponse> getPlaceDetails(@PathVariable String placeId) {
        try {
            PlaceDetailsResponse response = placesService.getPlaceDetails(placeId);
            if (response.getPlace() == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(response);
        } catch (GooglePlacesClient.GooglePlacesException e) {
            return ResponseEntity.status(e.getHttpStatus()).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

