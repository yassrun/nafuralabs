package ma.nafura.achats.domain.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
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
@Table(name = "appels_offres_achat")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppelOffreAchat {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_PUBLIEE = "PUBLIEE";
    public static final String STATUS_CLOTUREE = "CLOTUREE";
    public static final String STATUS_ATTRIBUEE = "ATTRIBUEE";
    public static final String STATUS_INFRUCTUEUSE = "INFRUCTUEUSE";
    public static final String STATUS_ANNULEE = "ANNULEE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "numero", nullable = false, length = 50)
    private String numero;

    @Column(name = "objet", nullable = false, length = 500)
    private String objet;

    @Column(name = "chantier_id", length = 100)
    private String chantierId;

    @Column(name = "chantier_code", length = 50)
    private String chantierCode;

    @Column(name = "chantier_name", length = 255)
    private String chantierName;

    @Column(name = "date_publication")
    private LocalDate datePublication;

    @Column(name = "date_limite_depot", nullable = false)
    private LocalDate dateLimiteDepot;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "fournisseur_attribue_id", length = 100)
    private String fournisseurAttribueId;

    @Column(name = "fournisseur_attribue_name", length = 255)
    private String fournisseurAttribueName;

    @Column(name = "bc_genere_id", length = 100)
    private String bcGenereId;

    @Column(name = "bc_genere_numero", length = 50)
    private String bcGenereNumero;

    @Column(name = "total_attribue_ht", precision = 18, scale = 4)
    private BigDecimal totalAttribueHt;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "appels_offres_achat_invites",
            joinColumns = @JoinColumn(name = "appel_offre_achat_id"))
    @Column(name = "fournisseur_id", length = 100)
    @Builder.Default
    private List<String> fournisseurInvitesIds = new ArrayList<>();

    @OneToMany(mappedBy = "appelOffre", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference("ao-lignes")
    @Builder.Default
    private List<AppelOffreLigne> lignes = new ArrayList<>();

    @OneToMany(mappedBy = "appelOffre", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference("ao-offres")
    @Builder.Default
    private List<OffreFournisseur> reponses = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.status == null) {
            this.status = STATUS_BROUILLON;
        }
        if (this.fournisseurInvitesIds == null) {
            this.fournisseurInvitesIds = new ArrayList<>();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
