package ma.nafura.marches.domain.model;

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
@Table(name = "ordres_service")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrdreServiceMarche {

    public static final String TYPE_COMMENCEMENT = "COMMENCEMENT";
    public static final String TYPE_ARRET = "ARRET";
    public static final String TYPE_REPRISE = "REPRISE";
    public static final String TYPE_MODIFICATION = "MODIFICATION";
    public static final String TYPE_NOTIFICATION = "NOTIFICATION";

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_EMIS = "EMIS";
    public static final String STATUS_RECEPTIONNE = "RECEPTIONNE";
    public static final String STATUS_ANNULE = "ANNULE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "numero", nullable = false, length = 50)
    private String numero;

    @Column(name = "contrat_marche_id", nullable = false, length = 100)
    private String contratMarcheId;

    @Column(name = "chantier_id", length = 100)
    private String chantierId;

    @Column(name = "chantier_code", length = 50)
    private String chantierCode;

    @Column(name = "type", nullable = false, length = 30)
    private String type;

    @Column(name = "date_emission")
    private LocalDate dateEmission;

    @Column(name = "emetteur", length = 30)
    private String emetteur;

    @Column(name = "objet", length = 255)
    private String objet;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "impact_delai")
    private Integer impactDelai;

    @Column(name = "impact_cout", precision = 18, scale = 4)
    private BigDecimal impactCout;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "date_accuse_reception")
    private LocalDate dateAccuseReception;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.status == null) {
            this.status = STATUS_BROUILLON;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
