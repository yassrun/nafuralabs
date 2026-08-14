package ma.nafura.achats.domain.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "offres_fournisseur")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OffreFournisseur {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appel_offre_achat_id", nullable = false)
    @JsonBackReference("ao-offres")
    private AppelOffreAchat appelOffre;

    @Column(name = "fournisseur_id", nullable = false, length = 100)
    private String fournisseurId;

    @Column(name = "fournisseur_name", length = 255)
    private String fournisseurName;

    @Column(name = "date_reponse")
    private LocalDate dateReponse;

    @Column(name = "total_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalHt;

    @Column(name = "delai_livraison_jours")
    private Integer delaiLivraisonJours;

    @Column(name = "conditions_paiement", length = 255)
    private String conditionsPaiement;

    @Column(name = "notes")
    private String notes;

    @Column(name = "retenue", nullable = false)
    private boolean retenue;

    @Column(name = "score", precision = 8, scale = 2)
    private BigDecimal score;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "offre", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference("offre-lignes")
    @Builder.Default
    private List<OffreFournisseurLigne> lignes = new ArrayList<>();

    @JsonProperty("aoId")
    public String getAoId() {
        if (appelOffre != null && appelOffre.getId() != null) {
            return appelOffre.getId().toString();
        }
        return null;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.totalHt == null) {
            this.totalHt = BigDecimal.ZERO;
        }
        if (this.lignes == null) {
            this.lignes = new ArrayList<>();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
