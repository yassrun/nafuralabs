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
import ma.nafura.platform.ai.conversation.domain.model.ConversationSession;
import ma.nafura.platform.ai.llm.model.ScopeType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "agent_run")
@Getter
@Setter
public class AgentRun {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private ConversationSession conversation;

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
    @Column(name = "status", nullable = false)
    private AgentRunStatus status;

    @Column(name = "prompt")
    private String prompt;

    @Column(name = "model")
    private String model;

    @Column(name = "llm_request_id")
    private String llmRequestId;

    @Column(name = "llm_cost_usd", precision = 12, scale = 6)
    private BigDecimal llmCostUsd;

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
            status = AgentRunStatus.PROPOSED;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}


