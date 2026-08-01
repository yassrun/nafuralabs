package com.blanner.dto.google;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GooglePlaceDetailsResponse {
    private String id;
    
    @JsonProperty("displayName")
    private DisplayName displayName;
    
    @JsonProperty("formattedAddress")
    private String formattedAddress;
    
    private Location location;
    
    @JsonProperty("types")
    private List<String> types;
    
    private Double rating;
    
    private List<Photo> photos;
    
    @JsonProperty("addressComponents")
    private List<AddressComponent> addressComponents;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DisplayName {
        private String text;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Location {
        private Double latitude;
        private Double longitude;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Photo {
        private String name;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddressComponent {
        @JsonProperty("longText")
        private String longText;
        
        @JsonProperty("shortText")
        private String shortText;
        
        @JsonProperty("types")
        private List<String> types;
        
        private String languageCode;
    }
}

