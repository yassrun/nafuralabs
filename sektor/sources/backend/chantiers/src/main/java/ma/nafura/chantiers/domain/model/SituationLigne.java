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
@Table(name = "situation_lignes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SituationLigne {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "situation_id", nullable = false, length = 100)
    private String situationId;

    @Column(name = "lot_id", length = 100)
    private String lotId;

    @Column(name = "poste_budgetaire_id", length = 100)
    private String posteBudgetaireId;

    @Column(nullable = false, length = 500)
    private String designation;

    @Column(length = 30)
    private String unite;

    @Column(name = "quantite_totale", precision = 18, scale = 4)
    private BigDecimal quantiteTotale;

    @Column(name = "quantite_precedente", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantitePrecedente;

    @Column(name = "quantite_cumulee", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantiteCumulee;

    @Column(name = "prix_unitaire", nullable = false, precision = 18, scale = 4)
    private BigDecimal prixUnitaire;

    @Column(name = "montant_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal montantHt;

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
        if (quantitePrecedente == null) {
            quantitePrecedente = BigDecimal.ZERO;
        }
        if (quantiteCumulee == null) {
            quantiteCumulee = BigDecimal.ZERO;
        }
        if (prixUnitaire == null) {
            prixUnitaire = BigDecimal.ZERO;
        }
        if (montantHt == null) {
            montantHt = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
