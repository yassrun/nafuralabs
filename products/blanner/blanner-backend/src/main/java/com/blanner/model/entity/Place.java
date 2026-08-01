package com.blanner.model.entity;

import com.blanner.model.enums.PlaceTypeEnum;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "places")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Place {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(nullable = false)
    private String name;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlaceTypeEnum type;
    
    @ElementCollection
    @CollectionTable(name = "place_optional_tags", joinColumns = @JoinColumn(name = "place_id"))
    @Column(name = "tag")
    private List<String> optionalTags;
    
    private String address;
    
    private String city;
    
    private Double lat;
    
    private Double lng;
    
    @Column(name = "google_place_id")
    private String googlePlaceId;
    
    private Double rating;
    
    @Builder.Default
    @Column(name = "is_billable")
    private Boolean isBillable = false;
    
    @Column(name = "business_owner_id")
    private String businessOwnerId;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
