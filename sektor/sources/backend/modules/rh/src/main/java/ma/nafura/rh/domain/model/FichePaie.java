package ma.nafura.rh.domain.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "fiches_paie")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FichePaie {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_VALIDEE = "VALIDEE";
    public static final String STATUS_PAYEE = "PAYEE";

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

    @Column(nullable = false, length = 7)
    private String mois;

    @Column(name = "salaire_base", nullable = false, precision = 18, scale = 4)
    private BigDecimal salaireBase;

    @Column(name = "indemnite_representation", nullable = false, precision = 18, scale = 4)
    private BigDecimal indemniteRepresentation;

    @Column(name = "indemnite_transport", nullable = false, precision = 18, scale = 4)
    private BigDecimal indemniteTransport;

    @Column(name = "montant_heures_sup", nullable = false, precision = 18, scale = 4)
    private BigDecimal montantHeuresSup;

    @Column(name = "salaire_brut", nullable = false, precision = 18, scale = 4)
    private BigDecimal salaireBrut;

    @JsonProperty("cotisationCNSS")
    @Column(name = "cotisation_cnss", nullable = false, precision = 18, scale = 4)
    private BigDecimal cotisationCnss;

    @JsonProperty("cotisationAMO")
    @Column(name = "cotisation_amo", nullable = false, precision = 18, scale = 4)
    private BigDecimal cotisationAmo;

    @Column(name = "total_retenues", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalRetenues;

    @Column(name = "salaire_net_imposable", nullable = false, precision = 18, scale = 4)
    private BigDecimal salaireNetImposable;

    @Column(nullable = false, precision = 18, scale = 4)
    private BigDecimal igr;

    @Column(name = "salaire_net_a_payer", nullable = false, precision = 18, scale = 4)
    private BigDecimal salaireNetAPayer;

    @Column(nullable = false, length = 30)
    private String status;

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
        if (indemniteRepresentation == null) {
            indemniteRepresentation = BigDecimal.ZERO;
        }
        if (indemniteTransport == null) {
            indemniteTransport = BigDecimal.ZERO;
        }
        if (montantHeuresSup == null) {
            montantHeuresSup = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
