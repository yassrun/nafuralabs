package ma.nafura.catalogue.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "catalog_prix_reference")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CatalogPrixReference {

    @Id
    private UUID id;

    @Column(name = "catalog_article_cle", nullable = false, length = 120)
    private String catalogArticleCle;

    @Column(nullable = false, precision = 18, scale = 4)
    private BigDecimal prix;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String devise = "MAD";

    @Column(length = 80)
    private String zone;

    @Column(name = "valid_from", nullable = false)
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(length = 200)
    private String source;

    @Column(length = 40)
    private String edition;

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
        if (devise == null) {
            devise = "MAD";
        }
    }
}
