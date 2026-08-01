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
public class GoogleAutocompleteRequest {
    private String input;
    
    @JsonProperty("locationBias")
    private LocationBias locationBias;
    
    @JsonProperty("includedPrimaryTypes")
    private List<String> includedPrimaryTypes;
    
    @JsonProperty("languageCode")
    private String languageCode;
    
    @JsonProperty("regionCode")
    private String regionCode;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationBias {
        private Circle circle;
        
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class Circle {
            private Center center;
            private Double radius;
            
            @Data
            @Builder
            @NoArgsConstructor
            @AllArgsConstructor
            public static class Center {
                private Double latitude;
                private Double longitude;
            }
        }
    }
}

