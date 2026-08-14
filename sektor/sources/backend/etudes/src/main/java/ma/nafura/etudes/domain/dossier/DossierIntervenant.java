package ma.nafura.etudes.domain.dossier;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "dossier_intervenant")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DossierIntervenant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "dossier_etude_id", nullable = false)
    private UUID dossierEtudeId;

    @Column(name = "user_id", nullable = false, length = 100)
    private String userId;

    @Column(name = "nom", length = 255)
    private String nom;

    /** CHARGE_ETUDE | REVISEUR | AVIS | APPROBATEUR */
    @Column(name = "role", nullable = false, length = 30)
    private String role;

    @Column(name = "invite", nullable = false)
    private Boolean invite;

    @Column(name = "premiere_action_at", nullable = false)
    private OffsetDateTime premiereActionAt;

    @Column(name = "derniere_action_at", nullable = false)
    private OffsetDateTime derniereActionAt;

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (premiereActionAt == null) {
            premiereActionAt = now;
        }
        if (derniereActionAt == null) {
            derniereActionAt = now;
        }
        if (invite == null) {
            invite = false;
        }
    }
}
