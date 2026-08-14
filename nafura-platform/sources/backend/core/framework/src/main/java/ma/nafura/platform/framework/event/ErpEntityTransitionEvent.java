package ma.nafura.platform.framework.event;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * Published when an ERP domain entity changes state in a way that should notify users
 * (situation soumise, congé approuvé, BC validé, approbation en attente, etc.).
 */
@Getter
public class ErpEntityTransitionEvent extends ApplicationEvent {

    private final UUID tenantId;
    private final String entityType;
    private final String entityId;
    private final String entityRef;
    private final String transition;
    private final String title;
    private final String body;
    private final String actionUrl;
    private final List<UUID> recipientUserIds;
    private final List<String> recipientRoleCodes;

    public ErpEntityTransitionEvent(
            Object source,
            UUID tenantId,
            String entityType,
            String entityId,
            String entityRef,
            String transition,
            String title,
            String body,
            String actionUrl,
            List<UUID> recipientUserIds,
            List<String> recipientRoleCodes) {
        super(source);
        this.tenantId = tenantId;
        this.entityType = entityType;
        this.entityId = entityId;
        this.entityRef = entityRef != null ? entityRef : entityId;
        this.transition = transition;
        this.title = title;
        this.body = body;
        this.actionUrl = actionUrl;
        this.recipientUserIds = recipientUserIds != null ? List.copyOf(recipientUserIds) : List.of();
        this.recipientRoleCodes =
                recipientRoleCodes != null ? List.copyOf(recipientRoleCodes) : List.of();
    }

    public static ErpEntityTransitionEvent forRoles(
            Object source,
            UUID tenantId,
            String entityType,
            String entityId,
            String entityRef,
            String transition,
            String title,
            String body,
            String actionUrl,
            String... roleCodes) {
        return new ErpEntityTransitionEvent(
                source,
                tenantId,
                entityType,
                entityId,
                entityRef,
                transition,
                title,
                body,
                actionUrl,
                List.of(),
                roleCodes != null ? List.of(roleCodes) : List.of());
    }

    public static ErpEntityTransitionEvent forUsers(
            Object source,
            UUID tenantId,
            String entityType,
            String entityId,
            String entityRef,
            String transition,
            String title,
            String body,
            String actionUrl,
            List<UUID> userIds) {
        return new ErpEntityTransitionEvent(
                source,
                tenantId,
                entityType,
                entityId,
                entityRef,
                transition,
                title,
                body,
                actionUrl,
                userIds != null ? userIds : Collections.emptyList(),
                List.of());
    }
}
