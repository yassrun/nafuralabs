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
@Table(name = "contrats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contrat {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_EN_COURS = "EN_COURS";
    public static final String STATUS_SIGNE = "SIGNE";
    public static final String STATUS_EXPIRE = "EXPIRE";
    public static final String STATUS_RESILIE = "RESILIE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "employe_id", nullable = false, length = 100)
    private String employeId;

    @Column(name = "type_contrat", nullable = false, length = 30)
    private String typeContrat;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin")
    private LocalDate dateFin;

    @Column(name = "salaire_base", nullable = false, precision = 18, scale = 4)
    private BigDecimal salaireBase;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "signature_data_url")
    private String signatureDataUrl;

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
        if (salaireBase == null) {
            salaireBase = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
