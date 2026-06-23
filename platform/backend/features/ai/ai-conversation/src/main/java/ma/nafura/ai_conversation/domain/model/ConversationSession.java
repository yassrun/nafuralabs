package ma.nafura.platform.ai.conversation.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import ma.nafura.platform.ai.llm.model.LlmMode;
import ma.nafura.platform.ai.llm.model.ScopeType;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "conversation_session")
@Getter
@Setter
public class ConversationSession {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "application_id", nullable = false)
    private String applicationId;

    @Column(name = "tenant_id")
    private String tenantId;

    @Column(name = "actor_sub", nullable = false)
    private String actorSub;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope_type", nullable = false)
    private ScopeType scopeType;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode", nullable = false)
    private LlmMode mode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ConversationStatus status;

    @Column(name = "title")
    private String title;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (status == null) {
            status = ConversationStatus.ACTIVE;
        }
        if (mode == null) {
            mode = LlmMode.ASK;
        }
        if (scopeType == null) {
            scopeType = ScopeType.GLOBAL;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}


