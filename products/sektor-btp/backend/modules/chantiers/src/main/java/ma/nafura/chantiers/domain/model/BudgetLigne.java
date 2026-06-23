package ma.nafura.chantiers.domain.model;

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
@Table(name = "budget_lignes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetLigne {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "budget_chantier_id", nullable = false, length = 100)
    private String budgetChantierId;

    @Column(nullable = false, length = 30)
    private String rubrique;

    @Column(nullable = false)
    private String label;

    @Column(length = 100)
    private String lot;

    @Column(name = "previsionnel_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal previsionnelHt;

    @Column(name = "revise_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal reviseHt;

    @Column(name = "engage_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal engageHt;

    @Column(name = "realise_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal realiseHt;

    @Column(name = "poste_budgetaire_id", length = 100)
    private String posteBudgetaireId;

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
        if (previsionnelHt == null) {
            previsionnelHt = BigDecimal.ZERO;
        }
        if (reviseHt == null) {
            reviseHt = BigDecimal.ZERO;
        }
        if (engageHt == null) {
            engageHt = BigDecimal.ZERO;
        }
        if (realiseHt == null) {
            realiseHt = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
