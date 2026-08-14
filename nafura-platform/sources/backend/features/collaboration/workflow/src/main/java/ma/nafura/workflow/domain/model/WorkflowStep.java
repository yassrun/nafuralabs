package ma.nafura.platform.collaboration.workflow.domain.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "workflow_steps")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowStep {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "workflow_template_id", nullable = false)
    private UUID workflowTemplateId;

    @Column(name = "step_number", nullable = false)
    private Integer stepNumber;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "approver_role", nullable = false, length = 80)
    private String approverRole;

    @Column(name = "condition")
    private String condition;

    @Column(name = "timeout_hours")
    private Integer timeoutHours;

    @Column(name = "escalation_role", length = 80)
    private String escalationRole;

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

