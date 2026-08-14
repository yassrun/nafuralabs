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
@Table(name = "phs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Phs {

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

    @Column(nullable = false, length = 500)
    private String titre;

    @Column(nullable = false)
    private Integer version;

    @Column(name = "date_revision", nullable = false)
    private LocalDate dateRevision;

    @Column(name = "auteur_nom", nullable = false, length = 255)
    private String auteurNom;

    @Column(columnDefinition = "TEXT")
    private String contenu;

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
        if (version == null) {
            version = 1;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
