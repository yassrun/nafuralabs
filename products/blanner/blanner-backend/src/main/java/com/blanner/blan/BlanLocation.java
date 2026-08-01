package com.blanner.blan;

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
public class BlanLocation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "mode", nullable = false)
    private LocationMode mode;
    
    // EXACT_PLACE fields
    @Column(name = "place_id")
    private String placeId; // Google Place ID
    
    @Column(name = "place_name")
    private String placeName;
    
    @Column(name = "address", columnDefinition = "TEXT")
    private String address;
    
    @Column(name = "latitude")
    private Double latitude;
    
    @Column(name = "longitude")
    private Double longitude;
    
    // AREA fields
    @Column(name = "area_name")
    private String areaName;
    
    @Embedded
    private BoundingBox areaBoundingBox;
    
    // FLEXIBLE mode has no specific fields
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Embeddable
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BoundingBox {
        @Column(name = "bbox_northeast_lat")
        private Double northeastLat;
        
        @Column(name = "bbox_northeast_lng")
        private Double northeastLng;
        
        @Column(name = "bbox_southwest_lat")
        private Double southwestLat;
        
        @Column(name = "bbox_southwest_lng")
        private Double southwestLng;
    }
}

