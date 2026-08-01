package com.blanner.categories;

import com.blanner.model.enums.Billability;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "categories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Category {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(name = "location_title")
    private String locationTitle;
    
    @Column(name = "default_image")
    private String defaultImage;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "google_tags", columnDefinition = "jsonb")
    private List<String> googleTags;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Billability billability;
    
    @Column(name = "order_index")
    private Integer orderIndex;
    
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean active = true;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}

