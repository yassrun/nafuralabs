package ma.nafura.venuecatalog.enrichment.adapter.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "catalog_place_geo_resolutions")
@Getter
@Setter
public class CatalogPlaceGeoResolutionEntity {

    @Id
    private UUID id;

    @Column(name = "catalog_place_id", nullable = false)
    private UUID catalogPlaceId;

    @Column(name = "district_code", length = 64)
    private String districtCode;

    @Column(name = "district_label", length = 128)
    private String districtLabel;

    @Column(nullable = false, length = 32)
    private String method;

    @Column(nullable = false)
    private double confidence;

    @Column(name = "geo_reference_version", length = 64)
    private String geoReferenceVersion;

    @Column(name = "geo_hash", nullable = false, length = 64)
    private String geoHash;

    @Column(name = "needs_review", nullable = false)
    private boolean needsReview;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (id == null) {
            id = UUID.randomUUID();
        }
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
