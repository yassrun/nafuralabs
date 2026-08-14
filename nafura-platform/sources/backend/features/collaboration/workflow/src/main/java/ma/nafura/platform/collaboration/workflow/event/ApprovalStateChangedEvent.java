package ma.nafura.platform.collaboration.workflow.event;

import java.util.UUID;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class ApprovalStateChangedEvent extends ApplicationEvent {

    private final UUID tenantId;
    private final UUID approvalRequestId;
    private final String entityType;
    private final UUID entityId;
    private final String newStatus;
    private final String decidedBy;

    public ApprovalStateChangedEvent(
        Object source,
        UUID tenantId,
        UUID approvalRequestId,
        String entityType,
        UUID entityId,
        String newStatus,
        String decidedBy
    ) {
        super(source);
        this.tenantId = tenantId;
        this.approvalRequestId = approvalRequestId;
        this.entityType = entityType;
        this.entityId = entityId;
        this.newStatus = newStatus;
        this.decidedBy = decidedBy;
    }
}

