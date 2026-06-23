package ma.nafura.venuecatalog.place.adapter.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import ma.nafura.venuecatalog.place.domain.PlaceProvider;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "catalog_place_source_records")
@Getter
@Setter
public class CatalogPlaceSourceRecordEntity {

    @Id
    private UUID id;

    @Column(name = "catalog_place_id", nullable = false)
    private UUID catalogPlaceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlaceProvider provider;

    @Column(name = "external_id", nullable = false, length = 128)
    private String externalId;

    @Column(name = "fetched_at", nullable = false)
    private OffsetDateTime fetchedAt;

    @Column(name = "freshness_until", nullable = false)
    private OffsetDateTime freshnessUntil;

    @Column(name = "raw_checksum", nullable = false, length = 128)
    private String rawChecksum;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }
}
