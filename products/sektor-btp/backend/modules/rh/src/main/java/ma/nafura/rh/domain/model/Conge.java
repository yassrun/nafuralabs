package ma.nafura.rh.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
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
@Table(name = "conges")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conge {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_DEMANDE = "DEMANDE";
    public static final String STATUS_APPROUVE = "APPROUVE";
    public static final String STATUS_REFUSE = "REFUSE";
    public static final String STATUS_EN_COURS = "EN_COURS";
    public static final String STATUS_SOLDE = "SOLDE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 50)
    private String numero;

    @Column(name = "employe_id", nullable = false, length = 100)
    private String employeId;

    @Column(name = "employe_nom", length = 255)
    private String employeNom;

    @Column(nullable = false, length = 30)
    private String type;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Column(name = "nombre_jours", nullable = false, precision = 8, scale = 2)
    private BigDecimal nombreJours;

    @Column(nullable = false, length = 30)
    private String status;

    private String motif;

    @Column(name = "motif_refus")
    private String motifRefus;

    private String notes;

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
        if (status == null || status.isBlank()) {
            status = STATUS_BROUILLON;
        }
        if (nombreJours == null) {
            nombreJours = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
