package ma.nafura.hse.domain.model;

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
@Table(name = "epi_dotations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EpiDotation {

    public static final String STATUS_OK = "OK";
    public static final String STATUS_A_RENOUVELER = "A_RENOUVELER";
    public static final String STATUS_EXPIRE = "EXPIRE";
    public static final String STATUS_PERDU = "PERDU";

    public static final String CATEGORIE_TETE = "TETE";
    public static final String CATEGORIE_YEUX = "YEUX";
    public static final String CATEGORIE_PIEDS = "PIEDS";
    public static final String CATEGORIE_MAINS = "MAINS";
    public static final String CATEGORIE_CORPS = "CORPS";
    public static final String CATEGORIE_RESPIRATION = "RESPIRATION";
    public static final String CATEGORIE_AUDITION = "AUDITION";
    public static final String CATEGORIE_CHUTE = "CHUTE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 50)
    private String reference;

    @Column(nullable = false, length = 500)
    private String designation;

    @Column(nullable = false, length = 30)
    private String categorie;

    @Column(nullable = false, length = 100)
    private String marque;

    @Column(name = "norme_ce", length = 50)
    private String normeCe;

    @Column(name = "employe_id", nullable = false, length = 100)
    private String employeId;

    @Column(name = "employe_nom", nullable = false, length = 255)
    private String employeNom;

    @Column(name = "chantier_id", length = 100)
    private String chantierId;

    @Column(name = "chantier_code", length = 50)
    private String chantierCode;

    @Column(name = "date_attribution", nullable = false)
    private LocalDate dateAttribution;

    @Column(name = "date_expiration")
    private LocalDate dateExpiration;

    @Column(name = "prix_unitaire", nullable = false, precision = 18, scale = 4)
    private BigDecimal prixUnitaire;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "article_id", length = 100)
    private String articleId;

    @Column(name = "date_derniere_verification")
    private LocalDate dateDerniereVerification;

    @Column(name = "prochaine_verification")
    private LocalDate prochaineVerification;

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
        if (status == null) {
            status = STATUS_OK;
        }
        if (prixUnitaire == null) {
            prixUnitaire = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
