package ma.nafura.platform.framework.event;

import java.util.List;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

/** Convenience wrapper for publishing {@link ErpEntityTransitionEvent}. */
@Service
public class ErpNotificationPublisher {

    private final ApplicationEventPublisher eventPublisher;

    public ErpNotificationPublisher(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    public void notifyRoles(
            UUID tenantId,
            String entityType,
            String entityId,
            String entityRef,
            String transition,
            String title,
            String body,
            String actionUrl,
            String... roleCodes) {
        eventPublisher.publishEvent(ErpEntityTransitionEvent.forRoles(
                this,
                tenantId,
                entityType,
                entityId,
                entityRef,
                transition,
                title,
                body,
                actionUrl,
                roleCodes));
    }

    public void notifyUsers(
            UUID tenantId,
            String entityType,
            String entityId,
            String entityRef,
            String transition,
            String title,
            String body,
            String actionUrl,
            List<UUID> userIds) {
        eventPublisher.publishEvent(ErpEntityTransitionEvent.forUsers(
                this,
                tenantId,
                entityType,
                entityId,
                entityRef,
                transition,
                title,
                body,
                actionUrl,
                userIds));
    }
}
