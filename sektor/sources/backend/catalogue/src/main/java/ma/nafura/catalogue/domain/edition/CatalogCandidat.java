package ma.nafura.catalogue.domain.edition;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "catalog_candidats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CatalogCandidat {

    @Id
    private UUID id;

    @Column(name = "libelle_propose", nullable = false, length = 300)
    private String libellePropose;

    @Column(length = 40)
    private String nature;

    @Column(name = "unite_code", length = 20)
    private String uniteCode;

    @Column(name = "code_famille", length = 40)
    private String codeFamille;

    @Column(name = "type_objet", nullable = false, length = 20)
    @Builder.Default
    private String typeObjet = "ARTICLE";

    @Column(name = "nb_tenants_confirmants", nullable = false)
    @Builder.Default
    private Integer nbTenantsConfirmants = 0;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "exemples_libelles", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private String exemplesLibelles = "[]";

    @Column(name = "rendement_min", precision = 18, scale = 6)
    private BigDecimal rendementMin;

    @Column(name = "rendement_max", precision = 18, scale = 6)
    private BigDecimal rendementMax;

    @Column(name = "rendement_median", precision = 18, scale = 6)
    private BigDecimal rendementMedian;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String statut = "PROPOSE";

    @Column(name = "propose_par", nullable = false, length = 20)
    @Builder.Default
    private String proposePar = "REGLE";

    @Column(name = "model_version", length = 80)
    private String modelVersion;

    @Column(name = "decide_par", length = 120)
    private String decidePar;

    @Column(name = "decide_le")
    private OffsetDateTime decideLe;

    @Column(name = "catalog_cle_creee", length = 120)
    private String catalogCleCreee;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (statut == null) {
            statut = "PROPOSE";
        }
        if (proposePar == null) {
            proposePar = "REGLE";
        }
        if (typeObjet == null) {
            typeObjet = "ARTICLE";
        }
        if (nbTenantsConfirmants == null) {
            nbTenantsConfirmants = 0;
        }
        if (exemplesLibelles == null) {
            exemplesLibelles = "[]";
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
