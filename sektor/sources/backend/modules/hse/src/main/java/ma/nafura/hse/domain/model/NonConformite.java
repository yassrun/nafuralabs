package ma.nafura.hse.domain.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "non_conformites")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NonConformite {

    public static final String STATUS_OUVERTE = "OUVERTE";
    public static final String STATUS_ASSIGNEE = "ASSIGNEE";
    public static final String STATUS_EN_TRAITEMENT = "EN_TRAITEMENT";
    public static final String STATUS_VERIFIEE = "VERIFIEE";
    public static final String STATUS_CLOTUREE = "CLOTUREE";

    public static final String TYPE_SECURITE = "SECURITE";
    public static final String TYPE_QUALITE = "QUALITE";
    public static final String TYPE_ENVIRONNEMENT = "ENVIRONNEMENT";
    public static final String TYPE_REGLEMENTAIRE = "REGLEMENTAIRE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 50)
    private String numero;

    @Column(name = "date_nc", nullable = false)
    private LocalDate dateNc;

    @Column(name = "chantier_id", length = 100)
    private String chantierId;

    @Column(name = "chantier_code", length = 50)
    private String chantierCode;

    @Column(name = "zone_chantier", length = 255)
    private String zoneChantier;

    @Column(name = "type_nc", nullable = false, length = 30)
    private String typeNc;

    @Column(nullable = false)
    private String description;

    @Column(name = "causes_racines")
    private String causesRacines;

    @Column(name = "action_corrective")
    private String actionCorrective;

    @Column(name = "action_preventive")
    private String actionPreventive;

    @Column(name = "verification_efficacite")
    private String verificationEfficacite;

    @Column(name = "date_verification_efficacite")
    private LocalDate dateVerificationEfficacite;

    @Column(name = "responsable_id", length = 100)
    private String responsableId;

    @Column(name = "responsable_nom", length = 255)
    private String responsableNom;

    @Column(name = "date_echeance")
    private LocalDate dateEcheance;

    @Column(name = "source_inspection_id", length = 100)
    private String sourceInspectionId;

    @Column(name = "source_inspection_numero", length = 50)
    private String sourceInspectionNumero;

    @Column(name = "cnss_ou_inspection_reference", length = 100)
    private String cnssOuInspectionReference;

    @Column(name = "registre_legal_numero", length = 100)
    private String registreLegalNumero;

    @Column(nullable = false, length = 30)
    private String status;

    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "nonConformite", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<CapaAction> capaActions = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (status == null) {
            status = STATUS_OUVERTE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
