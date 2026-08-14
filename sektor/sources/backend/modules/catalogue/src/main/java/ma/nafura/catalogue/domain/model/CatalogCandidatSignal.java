package ma.nafura.catalogue.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "catalog_candidat_signal")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CatalogCandidatSignal {

    @Id
    private UUID id;

    @Column(name = "candidat_id", nullable = false)
    private UUID candidatId;

    @Column(name = "tenant_hash", nullable = false, length = 64)
    private String tenantHash;

    @Column(name = "libelle_anonyme", nullable = false, length = 300)
    private String libelleAnonyme;

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
    }
}
