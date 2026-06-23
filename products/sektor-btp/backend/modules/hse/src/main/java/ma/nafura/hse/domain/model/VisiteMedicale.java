package ma.nafura.hse.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "visites_medicales")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisiteMedicale {

    public static final String TYPE_EMBAUCHE = "EMBAUCHE";
    public static final String TYPE_PERIODIQUE = "PERIODIQUE";
    public static final String TYPE_REPRISE = "REPRISE";
    public static final String TYPE_REPRISE_AT = "REPRISE_AT";

    public static final String APTITUDE_APTE = "APTE";
    public static final String APTITUDE_AVEC_RESTRICTION = "AVEC_RESTRICTION";
    public static final String APTITUDE_INAPTE = "INAPTE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "employe_id", nullable = false, length = 100)
    private String employeId;

    @Column(name = "employe_matricule", nullable = false, length = 50)
    private String employeMatricule;

    @Column(name = "employe_nom", nullable = false, length = 255)
    private String employeNom;

    @Column(name = "poste_occupe", nullable = false, length = 255)
    private String posteOccupe;

    @Column(nullable = false, length = 30)
    private String type;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false, length = 30)
    private String aptitude;

    @Column(name = "medecin_nom", nullable = false, length = 255)
    private String medecinNom;

    private String restrictions;

    @Column(name = "prochaine_echeance", nullable = false)
    private LocalDate prochaineEcheance;

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
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
