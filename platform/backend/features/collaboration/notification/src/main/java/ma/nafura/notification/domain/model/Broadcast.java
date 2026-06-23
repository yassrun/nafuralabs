package ma.nafura.platform.collaboration.notification.domain.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "broadcasts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Broadcast {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "broadcast_number", nullable = false, length = 60)
    private String broadcastNumber;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "message", nullable = false)
    private String message;

    @Column(name = "audience", nullable = false, length = 60)
    private String audience;

    @Column(name = "channel", nullable = false, length = 30)
    private String channel;

    @Column(name = "urgency", nullable = false, length = 30)
    private String urgency;

    @Column(name = "sent_at")
    private OffsetDateTime sentAt;

    @Column(name = "sent_by", nullable = false, length = 120)
    private String sentBy;

    @Column(name = "recipient_count")
    private Integer recipientCount;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}

