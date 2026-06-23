package ma.nafura.etudes.domain.model;

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

    @Column(name = "category", nullable = false, length = 30)
    private String category;

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
        if (this.fraisGenerauxPercent == null) {
            this.fraisGenerauxPercent = new BigDecimal("8");
        }
        if (this.beneficePercent == null) {
            this.beneficePercent = new BigDecimal("7");
        }
        if (this.prixUnitaireHt == null) {
            this.prixUnitaireHt = BigDecimal.ZERO;
        }
        if (this.sousTotalDebourse == null) {
            this.sousTotalDebourse = BigDecimal.ZERO;
        }
        if (this.derniereMaj == null) {
            this.derniereMaj = LocalDate.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
        this.derniereMaj = LocalDate.now();
    }
}
