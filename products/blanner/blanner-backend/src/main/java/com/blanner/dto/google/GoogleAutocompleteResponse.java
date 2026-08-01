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
public class GoogleAutocompleteResponse {
    @JsonProperty("suggestions")
    private List<Suggestion> suggestions;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Suggestion {
        @JsonProperty("placePrediction")
        private PlacePrediction placePrediction;
        
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class PlacePrediction {
            @JsonProperty("placeId")
            private String placeId;
            
            private Text text;
            
            @JsonProperty("structuredFormat")
            private StructuredFormat structuredFormat;
            
            @JsonProperty("placeTypes")
            private List<String> placeTypes;
        }
        
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class StructuredFormat {
            @JsonProperty("mainText")
            private Text mainText;
            
            @JsonProperty("secondaryText")
            private Text secondaryText;
        }
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Text {
        private String text;
    }
}

