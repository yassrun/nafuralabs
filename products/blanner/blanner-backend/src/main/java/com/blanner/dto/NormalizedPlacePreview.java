package com.blanner.dto;

import com.blanner.model.enums.PlaceSearchType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NormalizedPlacePreview {
    private String id;
    private String name;
    private String secondaryText;
    private List<String> types;
    private Double lat;
    private Double lng;
    private PlaceSearchType type;
}

