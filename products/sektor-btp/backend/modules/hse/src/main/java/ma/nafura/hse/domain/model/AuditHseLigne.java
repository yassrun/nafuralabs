package ma.nafura.hse.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "audit_hse_lignes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditHseLigne {

    public static final String REPONSE_OUI = "OUI";
    public static final String REPONSE_NON = "NON";
    public static final String REPONSE_NA = "NA";
    public static final String REPONSE_SANS_OBJET = "SANS_OBJET";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "audit_id", nullable = false, length = 100)
    private String auditId;

    @Column(nullable = false)
    private int ordre;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 500)
    private String libelle;

    @Column(length = 100)
    private String categorie;

    @Column(length = 20)
    private String reponse;

    private String commentaire;

    @Column(name = "nc_id", length = 100)
    private String ncId;

    @Column(name = "nc_numero", length = 50)
    private String ncNumero;

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
