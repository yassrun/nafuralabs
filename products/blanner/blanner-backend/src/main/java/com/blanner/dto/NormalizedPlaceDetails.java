package com.blanner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NormalizedPlaceDetails {
    private String id;
    private String name;
    private String address;
    private Double lat;
    private Double lng;
    private List<String> types;
    private Double rating;
    private List<String> photos;
}

