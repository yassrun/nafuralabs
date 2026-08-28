package ma.nafura.etudes.domain.dossier;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "dossier_agent_suggestions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DossierAgentSuggestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "dossier_etude_id", nullable = false)
    private UUID dossierEtudeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 40)
    private DossierAgentActionType actionType;

    @Column(name = "libelle", nullable = false, length = 500)
    private String libelle;

    @Enumerated(EnumType.STRING)
    @Column(name = "etat", nullable = false, length = 20)
    @Builder.Default
    private DossierAgentSuggestionEtat etat = DossierAgentSuggestionEtat.EN_ATTENTE;

    @Column(name = "provenance_json", columnDefinition = "TEXT")
    private String provenanceJson;

    @Column(name = "correction_note", length = 500)
    private String correctionNote;

    @Column(name = "fingerprint", nullable = false, length = 64)
    private String fingerprint;

    @Column(name = "acteur", length = 100)
    private String acteur;

    @Column(name = "decided_at")
    private OffsetDateTime decidedAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        if (etat == null) {
            etat = DossierAgentSuggestionEtat.EN_ATTENTE;
        }
    }
}
