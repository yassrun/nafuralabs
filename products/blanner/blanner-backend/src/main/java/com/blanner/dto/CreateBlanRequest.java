package com.blanner.dto;

import com.blanner.model.enums.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBlanRequest {
    
    // Location (nested object)
    private LocationDto location;
    
    // Schedule (nested object)
    private ScheduleDto schedule;
    
    // Blan fields
    @NotBlank(message = "Category ID is required")
    private String categoryId; // Category ID (required)
    
    @NotNull(message = "Creator ID is required")
    private UUID creatorId; // Creator ID (required)
    
    @NotNull(message = "Group size is required")
    private GroupSize groupSize;
    
    @NotNull(message = "Gender preference is required")
    private GenderPreference genderPref;
    
    @NotNull(message = "Mood is required")
    private Mood mood;
    
    private BillPolicy billPolicy;
    
    @NotNull(message = "Visibility is required")
    private Visibility visibility;
    
    private Boolean approvalRequired;
    private Integer maxParticipants;
    private String customDescription;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationDto {
        private LocationMode mode; // EXACT_PLACE, AREA, or FLEXIBLE
        
        // For EXACT_PLACE mode
        private String placeId; // Google Place ID
        private String placeName;
        private Double latitude;
        private Double longitude;
        
        // For AREA mode
        private String areaName;
        private BoundingBox areaBoundingBox;
        
        // Shared field (can be used for both EXACT_PLACE and AREA)
        private String address;
        
        // FLEXIBLE mode has no specific fields
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScheduleDto {
        private LocalDate date;
        private LocalTime time;
        private String timePhrase;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BoundingBox {
        private Double northeastLat;
        private Double northeastLng;
        private Double southwestLat;
        private Double southwestLng;
    }
}

