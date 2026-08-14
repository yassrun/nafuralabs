package ma.nafura.etudes.domain.ouvrage;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.api.dto.DpuHistoriqueEntryDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.nafura.etudes.domain.dpu.ComposantDpu;
import ma.nafura.etudes.domain.dpu.UniteMain;

@Entity
@Table(name = "ouvrages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ouvrage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "designation", nullable = false, length = 500)
    private String designation;

    /**
     * Legacy — synchronisé avec {@link #codeFamille}. Préférer codeLot / codeFamille (L10).
     */
    @Column(name = "category", nullable = false, length = 30)
    private String category;

    /** UsageLot — L10 / ADR PR2. */
    @Column(name = "code_lot", nullable = false, length = 30)
    private String codeLot;

    /** Famille métier ouvrage (grille provisoire PR2). */
    @Column(name = "code_famille", nullable = false, length = 30)
    private String codeFamille;

    /** SAISIE | ETUDE | CATALOGUE */
    @Column(name = "origine", nullable = false, length = 20)
    private String origine;

    @Column(name = "source_etude_id")
    private UUID sourceEtudeId;

    /** Clé métier string, jamais FK catalogue (L10 / pré-L14). */
    @Column(name = "catalog_cle_stable", length = 120)
    private String catalogCleStable;

    @Column(name = "unite", nullable = false, length = 30)
    private String unite;

    @Column(name = "prix_unitaire_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal prixUnitaireHt;

    @Column(name = "sous_total_debourse", nullable = false, precision = 18, scale = 4)
    private BigDecimal sousTotalDebourse;

    @Embedded
    private UniteMain uniteMain;

    @Column(name = "frais_generaux_percent", nullable = false, precision = 8, scale = 4)
    private BigDecimal fraisGenerauxPercent;

    @Column(name = "benefice_percent", nullable = false, precision = 8, scale = 4)
    private BigDecimal beneficePercent;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "notes")
    private String notes;

    @Column(name = "derniere_maj", nullable = false)
    private LocalDate derniereMaj;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "ouvrage", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @Builder.Default
    private List<ComposantOuvrage> composants = new ArrayList<>();

    @Transient
    @JsonProperty("dpuComposants")
    @Builder.Default
    private List<ComposantDpu> dpuComposants = new ArrayList<>();

    @Transient
    @JsonProperty("dpuHistorique")
    @Builder.Default
    private List<DpuHistoriqueEntryDto> dpuHistorique = new ArrayList<>();

    @Transient
    @JsonProperty("dpuId")
    private UUID dpuId;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.isActive == null) {
            this.isActive = true;
        }
        // FG / bénéfice : renseignés via ParametresEtudeService à la création (pas de défauts en dur ici)
        if (this.prixUnitaireHt == null) {
            this.prixUnitaireHt = BigDecimal.ZERO;
        }
        if (this.sousTotalDebourse == null) {
            this.sousTotalDebourse = BigDecimal.ZERO;
        }
        if (this.derniereMaj == null) {
            this.derniereMaj = LocalDate.now();
        }
        if (this.codeLot == null || this.codeLot.isBlank()) {
            this.codeLot = "GROS_OEUVRE";
        }
        if (this.codeFamille == null || this.codeFamille.isBlank()) {
            this.codeFamille = this.category != null && !this.category.isBlank() ? this.category : "DIVERS";
        }
        if (this.category == null || this.category.isBlank()) {
            this.category = this.codeFamille;
        }
        if (this.origine == null || this.origine.isBlank()) {
            this.origine = "SAISIE";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
        this.derniereMaj = LocalDate.now();
    }
}
