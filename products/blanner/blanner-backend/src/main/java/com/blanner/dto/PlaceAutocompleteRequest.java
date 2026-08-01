package com.blanner.dto;

import com.blanner.model.enums.PlaceSearchType;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaceAutocompleteRequest {
    private String query;
    
    private Double lat;
    
    private Double lng;
    
    @NotBlank(message = "Category is required")
    private String category;
    
    private PlaceSearchType searchType;
}

