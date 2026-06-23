package ma.nafura.hse.domain.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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

@Entity
@Table(name = "capa_actions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CapaAction {

    public static final String TYPE_CORRECTIVE = "CORRECTIVE";
    public static final String TYPE_PREVENTIVE = "PREVENTIVE";

    public static final String STATUS_PLANIFIEE = "PLANIFIEE";
    public static final String STATUS_EN_COURS = "EN_COURS";
    public static final String STATUS_TERMINEE = "TERMINEE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "non_conformite_id", nullable = false)
    private NonConformite nonConformite;

    @Column(name = "type_capa", nullable = false, length = 30)
    private String typeCapa;

    @Column(nullable = false)
    private String description;

    @Column(name = "responsable_id", length = 100)
    private String responsableId;

    @Column(name = "responsable_nom", length = 255)
    private String responsableNom;

    @Column(name = "date_echeance")
    private LocalDate dateEcheance;

    @Column(nullable = false, length = 30)
    private String status;

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
        if (status == null) {
            status = STATUS_PLANIFIEE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
