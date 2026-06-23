package ma.nafura.platform.collaboration.notification.event;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.collaboration.notification.service.NotificationCreationService;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.event.ErpEntityTransitionEvent;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ErpDomainNotificationListener {

    private static final int MAX_RECIPIENTS = 50;

    private final NotificationCreationService notificationCreationService;
    private final AppUserRepository appUserRepository;

    @EventListener
    public void onErpEntityTransition(ErpEntityTransitionEvent event) {
        Set<UUID> recipientIds = new LinkedHashSet<>(event.getRecipientUserIds());
        for (String roleCode : event.getRecipientRoleCodes()) {
            if (roleCode == null || roleCode.isBlank()) {
                continue;
            }
            Page<AppUser> page = appUserRepository.searchMembers(
                    event.getTenantId(),
                    false,
                    null,
                    true,
                    "ACTIVE",
                    true,
                    roleCode.trim(),
                    PageRequest.of(0, MAX_RECIPIENTS));
            page.getContent().stream().map(AppUser::getId).forEach(recipientIds::add);
        }

        if (recipientIds.isEmpty()) {
            return;
        }

        UUID entityUuid = parseUuidOrNull(event.getEntityId());

        for (UUID recipientId : recipientIds) {
            AppUser user = appUserRepository.findById(recipientId).orElse(null);
            if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
                continue;
            }
            withTenant(event.getTenantId(), () -> {
                NotificationEvent notificationEvent = NotificationEvent.builder()
                        .sourceObject(this)
                        .recipientId(recipientId)
                        .title(event.getTitle())
                        .body(event.getBody())
                        .entityType(event.getEntityType())
                        .entityId(entityUuid)
                        .source("erp_" + event.getEntityType().toLowerCase())
                        .actionUrl(event.getActionUrl())
                        .build();
                notificationCreationService.createAndDeliver(notificationEvent, user.getEmail());
            });
        }
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

    private UUID parseUuidOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
