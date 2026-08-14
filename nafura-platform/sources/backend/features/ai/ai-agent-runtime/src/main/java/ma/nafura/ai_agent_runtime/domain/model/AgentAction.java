package ma.nafura.platform.ai.agent.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import ma.nafura.platform.ai.conversation.domain.model.ConversationMessage;
import ma.nafura.platform.ai.conversation.domain.model.ConversationSession;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "agent_action")
@Getter
@Setter
public class AgentAction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id", nullable = false)
    private AgentRun run;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private ConversationSession conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assistant_message_id")
    private ConversationMessage assistantMessage;

    @Column(name = "tool_key", nullable = false)
    private String toolKey;

    @Column(name = "title")
    private String title;

    @Column(name = "action_key")
    private String actionKey;

    @Column(name = "permission_key")
    private String permissionKey;

    @Column(name = "entitlement_key")
    private String entitlementKey;

    @Column(name = "requires_approval", nullable = false)
    private Boolean requiresApproval;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private AgentActionStatus status;

    @Column(name = "args_json")
    private String argsJson;

    @Column(name = "result_json")
    private String resultJson;

    @Column(name = "error")
    private String error;

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
            status = Boolean.TRUE.equals(requiresApproval)
                ? AgentActionStatus.PENDING_APPROVAL
                : AgentActionStatus.PROPOSED;
        }
        if (requiresApproval == null) {
            requiresApproval = Boolean.TRUE;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}


