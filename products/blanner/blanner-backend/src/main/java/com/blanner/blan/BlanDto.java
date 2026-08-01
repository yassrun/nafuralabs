package com.blanner.blan;

import com.blanner.model.enums.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlanDto {
    private UUID id;
    private UUID creatorId;
    private String creatorName;
    private String categoryId;
    private String categoryName;
    private LocationDto location;
    private ScheduleDto schedule;
    private GroupSize groupSize;
    private GenderPreference genderPref;
    private Mood mood;
    private BillPolicy billPolicy;
    private Visibility visibility;
    private Boolean approvalRequired;
    private Integer maxParticipants;
    private String customDescription;
    private BlanStatus status;
    private Integer likeCount;
    private Integer commentCount;
    private Integer joinCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationDto {
        private LocationMode mode;
        
        // EXACT_PLACE fields
        private String placeId; // Google Place ID
        private String placeName;
        private String address;
        private Double latitude;
        private Double longitude;
        
        // AREA fields
        private String areaName;
        private BoundingBox areaBoundingBox;
        
        // FLEXIBLE mode has no specific fields
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
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScheduleDto {
        private java.time.LocalDate date;
        private java.time.LocalTime time;
        private String timePhrase;
    }
}

