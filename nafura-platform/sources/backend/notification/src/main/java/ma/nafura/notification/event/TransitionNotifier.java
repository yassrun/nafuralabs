package ma.nafura.platform.collaboration.notification.event;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.BeanWrapperImpl;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.authorization.repository.TenantUserRoleRepository;
import ma.nafura.platform.authorization.service.PermissionService;
import ma.nafura.platform.collaboration.notification.service.NotificationRouter;
import ma.nafura.platform.collaboration.notification.service.NotificationRouter.Message;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.domain.TenantEntity;
import ma.nafura.platform.framework.record.HasStatus;
import ma.nafura.platform.framework.record.Lifecycle;
import ma.nafura.platform.framework.record.LifecycleEngine;
import ma.nafura.platform.framework.record.LifecycleNotifications;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;

/**
 * Delivers {@code notify} rules in the same transaction as the lifecycle transition.
 * The actor of a user transition is not notified. A system outcome (approval) still reaches {@code createdBy}.
 */
@Component
@RequiredArgsConstructor
public class TransitionNotifier implements LifecycleNotifications {

    private final LifecycleEngine lifecycles;
    private final NotificationRouter router;
    private final AppUserRepository users;
    private final TenantUserRoleRepository memberships;
    private final PermissionService permissions;

    /**
     * Same transaction as the transition. An after-commit listener never commits the inbox row:
     * the surrounding transaction is already finished, and a new one does not flush this persistence context.
     */
    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT, fallbackExecution = true)
    public void onTransitioned(LifecycleEngine.Transitioned event) {
        deliver(event);
    }

    private void deliver(LifecycleEngine.Transitioned event) {
        Lifecycle lifecycle = lifecycles.lifecycleOf(event.entityType()).orElse(null);
        if (lifecycle == null) return;
        Lifecycle.Transition transition = lifecycle.transition(event.transition()).orElse(null);
        if (transition == null || transition.notifications() == null || transition.notifications().isEmpty()) return;
        HasStatus record = lifecycles.load(event.entityType(), event.entityId()).orElse(null);
        if (record == null) return;

        UUID previous = TenantContext.getTenantIdOrNull();
        try {
            if (event.tenantId() != null) TenantContext.setTenantId(event.tenantId());
            for (Lifecycle.Notify notify : transition.notifications()) {
                boolean fanout = notify.to() != null && notify.to().startsWith("permission:");
                for (UUID recipient : recipients(notify.to(), record, event.tenantId())) {
                    if (skip(recipient, event, fanout)) continue;
                    router.send(Message.of(notify.event(), recipient, record).about(event.entityType(), event.entityId()));
                }
            }
        } finally {
            if (previous != null) TenantContext.setTenantId(previous);
            else TenantContext.clear();
        }
    }

    private boolean skip(UUID recipient, LifecycleEngine.Transitioned event, boolean fanout) {
        if (recipient == null || event.actorId() == null) return recipient == null;
        if (fanout) return recipient.equals(event.actorId());
        return !event.system() && recipient.equals(event.actorId());
    }

    private Set<UUID> recipients(String to, HasStatus record, UUID tenantId) {
        Set<UUID> ids = new LinkedHashSet<>();
        if (to == null || to.isBlank()) return ids;
        if ("createdBy".equals(to) && record instanceof TenantEntity entity && entity.getCreatedBy() != null) {
            ids.add(entity.getCreatedBy());
        } else if (to.startsWith("field:")) {
            UUID id = userId(new BeanWrapperImpl(record).getPropertyValue(to.substring("field:".length())));
            if (id != null) ids.add(id);
        } else if (to.startsWith("permission:") && tenantId != null) {
            String permission = to.substring("permission:".length());
            for (var membership : memberships.findByTenantId(tenantId)) {
                if (permissions.hasPermission(membership.getRoleCode(), permission) && membership.getUserId() != null) {
                    ids.add(membership.getUserId());
                }
            }
        }
        return ids;
    }

    private UUID userId(Object value) {
        if (value instanceof UUID id) return id;
        if (value instanceof String text && !text.isBlank()) {
            try {
                return UUID.fromString(text.trim());
            } catch (IllegalArgumentException ignored) {
                return users.findByEmailIgnoreCase(text.trim()).map(AppUser::getId).orElse(null);
            }
        }
        return null;
    }
}
