package ma.nafura.hse.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

@Entity
@Table(name = "duer_risques")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DuerRisque {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "duer_id", nullable = false, length = 100)
    private String duerId;

    @Column(nullable = false, length = 500)
    private String libelle;

    @Column(nullable = false)
    private int probabilite;

    @Column(nullable = false)
    private int gravite;

    @Column(name = "code_activite", length = 50)
    private String codeActivite;

    private String mesures;

    @Column(nullable = false)
    private int ordre;

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
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
