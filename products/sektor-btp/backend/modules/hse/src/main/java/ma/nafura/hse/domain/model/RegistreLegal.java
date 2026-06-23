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
@Table(name = "registres_legaux")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistreLegal {

    public static final String STATUT_OUVERT = "OUVERT";
    public static final String STATUT_CLOS = "CLOS";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 30)
    private String registre;

    @Column(nullable = false, length = 50)
    private String numero;

    @Column(nullable = false)
    private LocalDate date;

    @Column(length = 100)
    private String reference;

    @Column(name = "chantier_id", length = 100)
    private String chantierId;

    @Column(name = "chantier_code", length = 50)
    private String chantierCode;

    @Column(name = "employe_id", length = 100)
    private String employeId;

    @Column(name = "employe_nom", length = 255)
    private String employeNom;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 20)
    private String statut;

    @Column(name = "derniere_maj")
    private LocalDate derniereMaj;

    @Column(name = "extension_json", columnDefinition = "TEXT")
    private String extensionJson;

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
        if (statut == null) {
            statut = STATUT_OUVERT;
        }
        if (derniereMaj == null) {
            derniereMaj = date;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
