package ma.nafura.platform.collaboration.workflow.api;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/** Item for pending approvals and history dashboard. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalDashboardItem {

    private UUID id;
    private String entityType;
    private UUID entityId;
    private String title;
    private String status;
    private String currentStep;
    private String requestedBy;
    private OffsetDateTime requestedAt;
    private String approvedBy;
    private OffsetDateTime approvedAt;
    private String decisionComment;
}
