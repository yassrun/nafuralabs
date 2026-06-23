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
@Table(name = "ppsps")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ppsps {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_REVISION = "REVISION";
    public static final String STATUS_VALIDE = "VALIDE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 50)
    private String numero;

    @Column(name = "chantier_id", nullable = false, length = 100)
    private String chantierId;

    @Column(name = "chantier_code", nullable = false, length = 50)
    private String chantierCode;

    @Column(name = "chantier_nom", nullable = false, length = 500)
    private String chantierNom;

    @Column(name = "coordonnateur_sps_nom", nullable = false, length = 255)
    private String coordonnateurSpsNom;

    @Column(name = "coordonnateur_sps_tel", length = 50)
    private String coordonnateurSpsTel;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "mesures_collectives", nullable = false, columnDefinition = "TEXT")
    private String mesuresCollectives;

    @Column(name = "effectifs_max_jour")
    private Integer effectifsMaxJour;

    @Column(name = "hommes_jour_estimes")
    private Integer hommesJourEstimes;

    private String observations;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(nullable = false)
    private Integer version;

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
            status = STATUS_BROUILLON;
        }
        if (version == null) {
            version = 1;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
