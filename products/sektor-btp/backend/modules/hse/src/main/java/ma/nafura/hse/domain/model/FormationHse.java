package ma.nafura.hse.domain.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
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
@Table(name = "formations_hse")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FormationHse {

    public static final String STATUS_PLANIFIEE = "PLANIFIEE";
    public static final String STATUS_EN_COURS = "EN_COURS";
    public static final String STATUS_TERMINEE = "TERMINEE";
    public static final String STATUS_ANNULEE = "ANNULEE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 50)
    private String numero;

    @Column(nullable = false, length = 500)
    private String titre;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin")
    private LocalDate dateFin;

    @Column(name = "duree_heures", nullable = false)
    private Integer dureeHeures;

    @Column(length = 255)
    private String formateur;

    @Column(length = 500)
    private String lieu;

    @Column(name = "nb_participants", nullable = false)
    private Integer nbParticipants;

    @Column(name = "habilitation_code", length = 50)
    private String habilitationCode;

    @Column(name = "attestation_reference", length = 100)
    private String attestationReference;

    @Column(name = "attestation_validite")
    private LocalDate attestationValidite;

    @Column(nullable = false, length = 30)
    private String status;

    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "formation_hse_participants", joinColumns = @JoinColumn(name = "formation_id"))
    @Column(name = "participant", length = 255)
    @Builder.Default
    private List<String> participants = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (status == null) {
            status = STATUS_PLANIFIEE;
        }
        if (dureeHeures == null) {
            dureeHeures = 0;
        }
        if (nbParticipants == null) {
            nbParticipants = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
