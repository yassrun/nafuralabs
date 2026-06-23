package ma.nafura.platform.framework.event;

import java.util.UUID;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class EntityAssignedEvent extends ApplicationEvent {

    private final UUID tenantId;
    private final String entityType;
    private final UUID entityId;
    private final UUID assigneeUserId;
    private final String assigneeEmail;
    private final UUID assignedByUserId;
    private final String assignedByEmail;
    private final String actionUrl;

    public EntityAssignedEvent(
            Object source,
            UUID tenantId,
            String entityType,
            UUID entityId,
            UUID assigneeUserId,
            String assigneeEmail,
            UUID assignedByUserId,
            String assignedByEmail,
            String actionUrl
    ) {
        super(source);
        this.tenantId = tenantId;
        this.entityType = entityType;
        this.entityId = entityId;
        this.assigneeUserId = assigneeUserId;
        this.assigneeEmail = assigneeEmail;
        this.assignedByUserId = assignedByUserId;
        this.assignedByEmail = assignedByEmail;
        this.actionUrl = actionUrl;
    }
}

