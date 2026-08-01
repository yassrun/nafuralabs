package com.blanner.model.entity;

import com.blanner.model.enums.LocationMode;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "blan_locations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Location {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "mode", nullable = false)
    private LocationMode mode;
    
    // Area fields (used when mode = AREA)
    @Column(name = "area_label")
    private String areaLabel;
    
    @Column(name = "area_lat")
    private Double areaLat;
    
    @Column(name = "area_lng")
    private Double areaLng;
    
    @Column(name = "map_radius_m")
    private Integer mapRadiusM;
    
    // Place Type relation (used when mode = AREA)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_type_id")
    private PlaceType placeType;
    
    // Place relation (used when mode = PLACE)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id")
    private Place place;
    
    // Location text (formatted display text)
    @Column(name = "location_text")
    private String locationText;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
