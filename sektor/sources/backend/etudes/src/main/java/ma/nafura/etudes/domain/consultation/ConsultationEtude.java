package ma.nafura.etudes.domain.consultation;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Consultation études accrochée au dossier. Paquet d'identités ({@code cle_stable})
 * sur plusieurs postes — pas une consult par article ni par poste.
 */
@Entity
@Table(name = "consultations_etudes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationEtude {

    public static final String STATUT_OUVERTE = "OUVERTE";
    public static final String STATUT_CLOTUREE = "CLOTUREE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "dossier_etude_id", nullable = false)
    private UUID dossierEtudeId;

    @Column(name = "statut", nullable = false, length = 20)
    @Builder.Default
    private String statut = STATUT_OUVERTE;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "consultation_etude_paquet",
            joinColumns = @JoinColumn(name = "consultation_id"))
    @Column(name = "cle_stable", nullable = false, length = 120)
    @Builder.Default
    private Set<String> paquetCleStables = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "consultation_etude_invites",
            joinColumns = @JoinColumn(name = "consultation_id"))
    @Column(name = "partenaire_id", nullable = false)
    @Builder.Default
    private Set<UUID> partenaireIds = new HashSet<>();

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
            statut = STATUT_OUVERTE;
        }
        if (paquetCleStables == null) {
            paquetCleStables = new HashSet<>();
        }
        if (partenaireIds == null) {
            partenaireIds = new HashSet<>();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
