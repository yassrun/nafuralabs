package ma.nafura.chantiers.domain.calendrier;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Un calendrier par chantier (A04 provisoire). Versions à date d'effet, fuseau IANA.
 * Création paresseuse — jamais à la conversion palier 1.
 */
@Entity
@Table(name = "chantier_calendriers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendrierChantier {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "chantier_id", nullable = false, length = 100)
    private String chantierId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CalendrierKind kind;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (kind == null) {
            kind = CalendrierKind.STANDARD;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
