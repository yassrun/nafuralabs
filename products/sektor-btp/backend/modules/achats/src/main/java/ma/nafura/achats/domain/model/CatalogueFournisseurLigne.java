package ma.nafura.achats.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "catalogue_fournisseur_lignes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CatalogueFournisseurLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "fournisseur_id", nullable = false, length = 100)
    private String fournisseurId;

    @Column(name = "article_id", nullable = false, length = 100)
    private String articleId;

    @Column(name = "ref_fournisseur", length = 100)
    private String refFournisseur;

    @Column(name = "designation", nullable = false)
    private String designation;

    @Column(name = "prix_unitaire_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal prixUnitaireHt;

    @Column(name = "uom", length = 30)
    private String uom;

    @Column(name = "actif", nullable = false)
    private Boolean actif;

    @Column(name = "currency_id")
    private UUID currencyId;

    @Column(name = "valid_from", nullable = false)
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "remise_percent", nullable = false, precision = 8, scale = 4)
    private BigDecimal remisePercent;

    @Column(name = "quantite_min", precision = 18, scale = 4)
    private BigDecimal quantiteMin;

    @Column(name = "delai_jours")
    private Integer delaiJours;

    @Column(name = "source", nullable = false, length = 20)
    private String source;

    @Column(name = "source_ref_id")
    private UUID sourceRefId;

    @Column(name = "incoterm", length = 20)
    private String incoterm;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    /**
     * Prix net après remise catalogue.
     */
    public BigDecimal prixNetHt() {
        BigDecimal brut = prixUnitaireHt != null ? prixUnitaireHt : BigDecimal.ZERO;
        BigDecimal remise = remisePercent != null ? remisePercent : BigDecimal.ZERO;
        return brut.multiply(BigDecimal.ONE.subtract(remise.movePointLeft(2)));
    }

    public boolean isValidAt(LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }
        if (validFrom != null && date.isBefore(validFrom)) {
            return false;
        }
        return validTo == null || !date.isAfter(validTo);
    }

    public boolean isPerimeAt(LocalDate date) {
        return validTo != null && date != null && validTo.isBefore(date);
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.actif == null) {
            this.actif = true;
        }
        if (this.validFrom == null) {
            this.validFrom = LocalDate.now();
        }
        if (this.remisePercent == null) {
            this.remisePercent = BigDecimal.ZERO;
        }
        if (this.source == null) {
            this.source = ma.nafura.achats.domain.CatalogueSource.SAISIE_MANUELLE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
