package ma.nafura.platform.collaboration.notification.event;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.collaboration.notification.service.NotificationCreationService;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.event.EntityAssignedEvent;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AssignmentNotificationListener {

    private final NotificationCreationService notificationCreationService;
    private final AppUserRepository appUserRepository;

    @EventListener
    public void onEntityAssigned(EntityAssignedEvent event) {
        if (event.getAssigneeUserId() == null && (event.getAssigneeEmail() == null || event.getAssigneeEmail().isBlank())) {
            return;
        }
        if (event.getAssigneeUserId() != null && event.getAssigneeUserId().equals(event.getAssignedByUserId())) {
            return;
        }
        if (event.getAssigneeEmail() != null
                && event.getAssignedByEmail() != null
                && event.getAssigneeEmail().equalsIgnoreCase(event.getAssignedByEmail())) {
            return;
        }

        AppUser assignee = resolveAssignee(event);
        if (assignee == null || assignee.getEmail() == null || assignee.getEmail().isBlank()) {
            return;
        }

        withTenant(event.getTenantId(), () -> {
            NotificationEvent notificationEvent = NotificationEvent.builder()
                    .sourceObject(this)
                    .recipientId(assignee.getId())
                    .title("Record assigned")
                    .body(String.format("You were assigned to %s.", readableEntity(event.getEntityType())))
                    .entityType(event.getEntityType())
                    .entityId(event.getEntityId())
                    .source("assignment")
                    .actionUrl(event.getActionUrl() != null ? event.getActionUrl() : "/")
                    .build();
            notificationCreationService.createAndDeliver(notificationEvent, assignee.getEmail());
        });
    }

    private AppUser resolveAssignee(EntityAssignedEvent event) {
        if (event.getAssigneeUserId() != null) {
            return appUserRepository.findById(event.getAssigneeUserId()).orElse(null);
        }
        if (event.getAssigneeEmail() != null) {
            return appUserRepository.findByEmailIgnoreCase(event.getAssigneeEmail()).orElse(null);
        }
        return null;
    }

    private void withTenant(UUID tenantId, Runnable work) {
        UUID previous = TenantContext.getTenantIdOrNull();
        try {
            TenantContext.setTenantId(tenantId);
            work.run();
        } finally {
            if (previous != null) {
                TenantContext.setTenantId(previous);
            } else {
                TenantContext.clear();
            }
        }
    }

    private String readableEntity(String entityType) {
        if (entityType == null || entityType.isBlank()) {
            return "record";
        }
        return entityType.replace('-', ' ').replace('_', ' ');
    }
}

