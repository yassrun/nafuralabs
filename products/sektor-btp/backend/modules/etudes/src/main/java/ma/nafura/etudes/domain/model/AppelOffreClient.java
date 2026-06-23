package ma.nafura.etudes.domain.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.nafura.etudes.api.dto.AOClientChecklistItemDto;
import ma.nafura.etudes.api.dto.AOClientDocumentDto;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "appels_offres_clients")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppelOffreClient {

    public static final String STATUS_A_ETUDIER = "A_ETUDIER";
    public static final String STATUS_EN_PREPARATION = "EN_PREPARATION";
    public static final String STATUS_SOUMIS = "SOUMIS";
    public static final String STATUS_ATTRIBUE = "ATTRIBUE";
    public static final String STATUS_PERDU = "PERDU";
    public static final String STATUS_INFRUCTUEUX = "INFRUCTUEUX";
    public static final String STATUS_ANNULE = "ANNULE";

    public static final String TYPE_PUBLIC = "PUBLIC";
    public static final String TYPE_PRIVE = "PRIVE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "numero", nullable = false, length = 50)
    private String numero;

    @Column(name = "reference", nullable = false, length = 100)
    private String reference;

    @Column(name = "objet", nullable = false, length = 500)
    private String objet;

    @Column(name = "donneur_ordre", nullable = false, length = 255)
    private String donneurOrdre;

    @Column(name = "type", nullable = false, length = 20)
    private String type;

    @Column(name = "date_limite_depot", nullable = false)
    private LocalDate dateLimiteDepot;

    @Column(name = "date_ouverture_plis")
    private LocalDate dateOuverturePlis;

    @Column(name = "caution_provisoire", precision = 18, scale = 4)
    private BigDecimal cautionProvisoire;

    @Column(name = "caution_definitive", precision = 18, scale = 4)
    private BigDecimal cautionDefinitive;

    @Column(name = "caution_retenue_garantie", precision = 18, scale = 4)
    private BigDecimal cautionRetenueGarantie;

    @Column(name = "estimation_moa_ht", precision = 18, scale = 4)
    private BigDecimal estimationMoaHt;

    @Column(name = "ville", length = 255)
    private String ville;

    @Column(name = "delai_execution_jours")
    private Integer delaiExecutionJours;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "devis_id", length = 100)
    private String devisId;

    @Column(name = "devis_numero", length = 50)
    private String devisNumero;

    @Column(name = "metre_id", length = 100)
    private String metreId;

    @Column(name = "metre_numero", length = 50)
    private String metreNumero;

    @Column(name = "resultat_rang_notre")
    private Integer resultatRangNotre;

    @Column(name = "resultat_nb_plis")
    private Integer resultatNbPlis;

    @Column(name = "resultat_attributaire", length = 255)
    private String resultatAttributaire;

    @Column(name = "resultat_montant_ht", precision = 18, scale = 4)
    private BigDecimal resultatMontantHt;

    @Column(name = "chantier_genere_id", length = 100)
    private String chantierGenereId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "documents", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private List<AOClientDocumentDto> documents = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "checklist", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private List<AOClientChecklistItemDto> checklist = new ArrayList<>();

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @JsonProperty("delaiRestant")
    public int getDelaiRestant() {
        if (dateLimiteDepot == null) {
            return 0;
        }
        return (int) ChronoUnit.DAYS.between(LocalDate.now(), dateLimiteDepot);
    }

    @JsonProperty("nbDocsObligatoires")
    public int getNbDocsObligatoires() {
        if (documents == null || documents.isEmpty()) {
            return 0;
        }
        return (int) documents.stream().filter(AOClientDocumentDto::isObligatoire).count();
    }

    @JsonProperty("nbDocsFournis")
    public int getNbDocsFournis() {
        if (documents == null || documents.isEmpty()) {
            return 0;
        }
        return (int) documents.stream()
                .filter(d -> d.isObligatoire() && d.isFourni())
                .count();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.status == null) {
            this.status = STATUS_A_ETUDIER;
        }
        if (this.documents == null) {
            this.documents = new ArrayList<>();
        }
        if (this.checklist == null) {
            this.checklist = new ArrayList<>();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
