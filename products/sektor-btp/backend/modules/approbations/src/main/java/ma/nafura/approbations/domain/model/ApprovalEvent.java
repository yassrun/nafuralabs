package ma.nafura.approbations.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "approval_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalEvent {

    public static final String ACTION_SOUMIS = "SOUMIS";
    public static final String ACTION_APPROUVE = "APPROUVE";
    public static final String ACTION_REJETE = "REJETE";
    public static final String ACTION_DEMANDE_COMPLEMENT = "DEMANDE_COMPLEMENT";
    public static final String ACTION_DELEGUE = "DELEGUE";
    public static final String ACTION_COMMENTE = "COMMENTE";
    public static final String ACTION_ESCALADE = "ESCALADE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "request_id", nullable = false, length = 100)
    private String requestId;

    @Column(nullable = false, length = 30)
    private String action;

    @Column(name = "user_id", nullable = false, length = 100)
    private String userId;

    @Column(name = "user_nom")
    private String userNom;

    private String commentaire;

    @Column(name = "payload_json", columnDefinition = "TEXT")
    private String payloadJson;

    @Column(name = "previous_hash", length = 64)
    private String previousHash;

    @Column(name = "event_hash", nullable = false, length = 64)
    private String eventHash;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
