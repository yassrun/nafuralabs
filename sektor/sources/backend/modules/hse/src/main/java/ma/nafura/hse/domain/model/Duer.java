package ma.nafura.hse.domain.model;

import com.fasterxml.jackson.annotation.JsonProperty;
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
@Table(name = "duer")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Duer {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_VALIDE = "VALIDE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 50)
    private String numero;

    @Column(name = "chantier_id", length = 100)
    private String chantierId;

    @Column(name = "chantier_code", length = 50)
    private String chantierCode;

    @Column(name = "chantier_nom", length = 255)
    @JsonProperty("chantierName")
    private String chantierNom;

    @Column(nullable = false, length = 20)
    private String version;

    @Column(name = "date_revision", nullable = false)
    private LocalDate dateRevision;

    @Column(name = "auteur_id", length = 100)
    private String auteurId;

    @Column(name = "auteur_nom", length = 255)
    private String auteurNom;

    @Column(name = "risques_identifies", nullable = false)
    private Integer risquesIdentifies;

    @Column(name = "actions_correctives", nullable = false)
    private Integer actionsCorrectives;

    private String observations;

    @Column(nullable = false, length = 30)
    private String status;

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
        if (risquesIdentifies == null) {
            risquesIdentifies = 0;
        }
        if (actionsCorrectives == null) {
            actionsCorrectives = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
