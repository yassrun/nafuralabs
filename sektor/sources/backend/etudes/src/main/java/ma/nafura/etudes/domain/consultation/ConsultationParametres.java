package ma.nafura.etudes.domain.consultation;

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

/**
 * Paramètres tenant de la consultation études — mode + min N.
 * Table études (le rôle app y écrit) ; pas {@code tenant_setting}.
 */
@Entity
@Table(name = "consultation_parametres")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationParametres {

    @Id
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "mode", nullable = false, length = 20)
    @Builder.Default
    private String mode = "OPTIONNELLE";

    @Column(name = "minimum", nullable = false)
    @Builder.Default
    private int minimum = 1;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void touch() {
        updatedAt = OffsetDateTime.now();
        if (mode == null) {
            mode = "OPTIONNELLE";
        }
        if (minimum < 1) {
            minimum = 1;
        }
    }
}
