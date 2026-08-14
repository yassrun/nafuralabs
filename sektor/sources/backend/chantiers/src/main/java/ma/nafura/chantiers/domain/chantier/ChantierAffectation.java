package ma.nafura.chantiers.domain.chantier;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Assignment of an RH employe to a chantier with a chantier-scoped role for a period.
 */
@Entity
@Table(name = "chantier_affectation")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChantierAffectation {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "chantier_id", nullable = false, length = 100)
    private String chantierId;

    @Column(name = "employe_id", nullable = false, length = 100)
    private String employeId;

    @Column(name = "role_code", nullable = false, length = 50)
    private String roleCode;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin")
    private LocalDate dateFin;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = Boolean.TRUE;

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
        if (isActive == null) {
            isActive = Boolean.TRUE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public boolean isEffectiveOn(LocalDate date) {
        if (!Boolean.TRUE.equals(isActive) || date == null || dateDebut == null) {
            return false;
        }
        if (date.isBefore(dateDebut)) {
            return false;
        }
        return dateFin == null || !date.isAfter(dateFin);
    }
}
