package ma.nafura.platform.ai.conversation.domain.model;

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
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "conversation_message")
@Getter
@Setter
public class ConversationMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private ConversationSession conversation;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private ConversationMessageRole role;

    @Column(name = "content", nullable = false)
    private String content;

    @Column(name = "metadata_json")
    private String metadataJson;

    @Column(name = "request_id")
    private String requestId;

    @Column(name = "tokens_in")
    private Long tokensIn;

    @Column(name = "tokens_out")
    private Long tokensOut;

    @Column(name = "tokens_total")
    private Long tokensTotal;

    @Column(name = "cost_usd", precision = 12, scale = 6)
    private BigDecimal costUsd;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}

