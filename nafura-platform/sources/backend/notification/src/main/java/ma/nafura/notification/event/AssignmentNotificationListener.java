package ma.nafura.platform.collaboration.notification.event;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.collaboration.notification.service.NotificationRouter;
import ma.nafura.platform.collaboration.notification.service.NotificationRouter.Message;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.event.EntityAssignedEvent;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AssignmentNotificationListener {

    private final NotificationRouter router;
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
        if (assignee == null) {
            return;
        }

        withTenant(event.getTenantId(), () -> {
            router.send(Message.of("platform.assignment", assignee.getId(),
                            java.util.Map.of("title", hasText(event.getTitle()) ? event.getTitle() : "Affectation"))
                    .body(hasText(event.getBody()) ? event.getBody() : defaultBody(event.getEntityType()))
                    .about(event.getEntityType(), event.getEntityId())
                    .link(event.getActionUrl() != null ? event.getActionUrl() : "/"));
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

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String defaultBody(String entityType) {
        if ("lot-etude".equals(entityType)) {
            return "Un lot t'a été affecté.";
        }
        if ("dossier-etude".equals(entityType)) {
            return "Une étude t'a été affectée.";
        }
        return readableEntity(entityType) + " t'a été affecté.";
    }

    private String readableEntity(String entityType) {
        if (entityType == null || entityType.isBlank()) {
            return "un enregistrement";
        }
        return entityType.replace('-', ' ').replace('_', ' ');
    }
}

