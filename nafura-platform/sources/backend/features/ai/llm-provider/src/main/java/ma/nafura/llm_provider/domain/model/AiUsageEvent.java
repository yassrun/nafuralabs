package ma.nafura.platform.ai.llm.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import ma.nafura.platform.ai.llm.model.LlmMode;
import ma.nafura.platform.ai.llm.model.ScopeType;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "ai_usage_event", indexes = {
    @Index(name = "idx_ai_usage_event_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_ai_usage_event_created_at", columnList = "created_at"),
    @Index(name = "idx_ai_usage_event_scope_idempotency", columnList = "scope_key,idempotency_key", unique = true)
})
@Getter
@Setter
public class AiUsageEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", nullable = false, unique = true)
    private String requestId;

    @Column(name = "tenant_id")
    private String tenantId;

    @Column(name = "scope_key", nullable = false)
    private String scopeKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope_type", nullable = false)
    private ScopeType scopeType;

    @Column(name = "idempotency_key")
    private String idempotencyKey;

    @Column(name = "application_id")
    private String applicationId;

    @Column(name = "domain_key")
    private String domainKey;

    @Column(name = "feature_key")
    private String featureKey;

    @Column(name = "resource_key")
    private String resourceKey;

    @Column(name = "action_key")
    private String actionKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode", nullable = false)
    private LlmMode mode;

    @Column(name = "conversation_id")
    private String conversationId;

    @Column(name = "message_id")
    private String messageId;

    @Column(name = "actor_sub")
    private String actorSub;

    @Column(name = "provider", nullable = false)
    private String provider;

    @Column(name = "model", nullable = false)
    private String model;

    @Column(name = "tokens_in")
    private Long tokensIn;

    @Column(name = "tokens_out")
    private Long tokensOut;

    @Column(name = "tokens_total")
    private Long tokensTotal;

    @Column(name = "cost_usd", precision = 12, scale = 6)
    private BigDecimal costUsd;

    @Column(name = "latency_ms")
    private Long latencyMs;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "error", length = 2000)
    private String error;

    @Column(name = "estimated", nullable = false)
    private Boolean estimated = false;

    @Column(name = "response_content", columnDefinition = "TEXT")
    private String responseContent;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}

