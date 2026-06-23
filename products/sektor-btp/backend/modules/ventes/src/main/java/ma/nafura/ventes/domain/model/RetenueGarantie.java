package ma.nafura.ventes.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "retenues_garantie")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RetenueGarantie {

    public static final String STATUT_IMMOBILISEE = "IMMOBILISEE";
    public static final String STATUT_DEMANDE_RESTITUTION = "DEMANDE_RESTITUTION";
    public static final String STATUT_RESTITUEE_PARTIEL = "RESTITUEE_PARTIEL";
    public static final String STATUT_RESTITUEE_TOTAL = "RESTITUEE_TOTAL";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "marche_id", nullable = false, length = 100)
    private String marcheId;

    @Column(name = "client_id", nullable = false, length = 100)
    private String clientId;

    @Column(name = "facture_id", length = 100)
    private String factureId;

    @Column(name = "montant_retenu", nullable = false, precision = 18, scale = 4)
    private BigDecimal montantRetenu;

    @Column(name = "cumul", nullable = false, precision = 18, scale = 4)
    private BigDecimal cumul;

    @Column(name = "montant_restitue", nullable = false, precision = 18, scale = 4)
    private BigDecimal montantRestitue;

    @Column(name = "statut", nullable = false, length = 30)
    private String statut;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.statut == null) {
            this.statut = STATUT_IMMOBILISEE;
        }
        if (this.montantRetenu == null) {
            this.montantRetenu = BigDecimal.ZERO;
        }
        if (this.cumul == null) {
            this.cumul = BigDecimal.ZERO;
        }
        if (this.montantRestitue == null) {
            this.montantRestitue = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
