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
import ma.nafura.venuecatalog.place.domain.MediaSource;
import ma.nafura.venuecatalog.place.domain.MediaStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "catalog_place_media")
@Getter
@Setter
public class CatalogPlaceMediaEntity {

    @Id
    private UUID id;

    @Column(name = "catalog_place_id", nullable = false)
    private UUID catalogPlaceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MediaSource source;

    @Column(name = "storage_key", nullable = false, length = 512)
    private String storageKey;

    @Column(name = "public_url")
    private String publicUrl;

    private Integer width;
    private Integer height;

    @Column(name = "attribution_text", nullable = false)
    private String attributionText;

    @Column(name = "author_name")
    private String authorName;

    @Column(nullable = false)
    private boolean reusable;

    @Column(name = "provider_photo_ref")
    private String providerPhotoRef;

    @Column(name = "content_checksum")
    private String contentChecksum;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "sort_order", nullable = false)
    private short sortOrder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MediaStatus status;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        if (status == null) {
            status = MediaStatus.ACTIVE;
        }
    }
}
