package ma.nafura.platform.collaboration.notification.domain.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "escalations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Escalation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "escalation_number", nullable = false, length = 60)
    private String escalationNumber;

    @Column(name = "workflow_instance_id", nullable = false)
    private UUID workflowInstanceId;

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "original_assignee", nullable = false, length = 120)
    private String originalAssignee;

    @Column(name = "escalated_to", nullable = false, length = 120)
    private String escalatedTo;

    @Column(name = "escalation_date", nullable = false)
    private OffsetDateTime escalationDate;

    @Column(name = "reason", nullable = false)
    private String reason;

    @Column(name = "resolved_date")
    private OffsetDateTime resolvedDate;

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

