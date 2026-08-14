package ma.nafura.venuecatalog.place.adapter.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import ma.nafura.venuecatalog.place.domain.CityCode;
import ma.nafura.venuecatalog.place.domain.PlaceStatus;
import ma.nafura.venuecatalog.place.domain.PrimaryCategory;
import ma.nafura.venuecatalog.place.domain.model.PlaceModels;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "catalog_places")
@Getter
@Setter
public class CatalogPlaceEntity {

    @Id
    private UUID id;

    @Column(name = "canonical_name", nullable = false)
    private String canonicalName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlaceStatus status;

    @Column(name = "country_code", nullable = false, length = 2)
    private String countryCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "city_code", nullable = false)
    private CityCode cityCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "primary_category", nullable = false)
    private PrimaryCategory primaryCategory;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "provider_types", columnDefinition = "jsonb")
    private List<String> providerTypes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private PlaceModels.Address address;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private PlaceModels.Geo geo;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private PlaceModels.Contact contact;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "opening_hours", columnDefinition = "jsonb")
    private List<PlaceModels.OpeningHoursDay> openingHours;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "provider_rating", columnDefinition = "jsonb")
    private PlaceModels.ProviderRating providerRating;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private PlaceModels.PlaceAttributes attributes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private PlaceModels.PlaceQuality quality;

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
