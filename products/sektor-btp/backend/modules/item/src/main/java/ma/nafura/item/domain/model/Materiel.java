package ma.nafura.item.domain.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "materiels")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Materiel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "famille_id", length = 50)
    private String familleId;

    @Column(name = "famille_name", length = 100)
    private String familleName;

    @Column(name = "marque", length = 100)
    private String marque;

    @Column(name = "modele", length = 100)
    private String modele;

    @Column(name = "numero_serie", nullable = false, length = 100)
    private String numeroSerie;

    @Column(name = "annee_mise_en_service")
    private Integer anneeMiseEnService;

    @Column(name = "puissance_capacite", length = 100)
    private String puissanceCapacite;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "date_dernier_entretien")
    private LocalDate dateDernierEntretien;

    @Column(name = "prochaine_maintenance")
    private LocalDate prochaineMaintenance;

    @Column(name = "notes_maintenance")
    private String notesMaintenance;

    @Column(name = "chantier_actuel_id", length = 50)
    private String chantierActuelId;

    @Column(name = "chantier_actuel_name", length = 200)
    private String chantierActuelName;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.status == null) {
            this.status = "DISPONIBLE";
        }
        if (this.isActive == null) {
            this.isActive = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
