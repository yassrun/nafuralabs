package ma.nafura.platform.collaboration.notification.inapp;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.collaboration.notification.domain.model.ErpAlertDismissal;
import ma.nafura.platform.collaboration.notification.repository.ErpAlertDismissalRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ErpAlertDismissalService {

    private final ErpAlertDismissalRepository repository;

    @Transactional(readOnly = true)
    public Set<String> dismissedKeysForCurrentUser() {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = requireUserId();
        return repository.findByTenantIdAndUserId(tenantId, userId).stream()
                .map(ErpAlertDismissal::getAlertKey)
                .collect(Collectors.toSet());
    }

    @Transactional
    public void dismiss(String alertKey) {
        if (alertKey == null || alertKey.isBlank()) {
            return;
        }
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = requireUserId();
        repository.save(ErpAlertDismissal.builder()
                .tenantId(tenantId)
                .userId(userId)
                .alertKey(alertKey.trim())
                .build());
    }

    /** Remove dismissals for alerts that no longer exist (underlying issue resolved). */
    @Transactional
    public void cleanupResolved(List<String> activeAlertKeys) {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = requireUserId();
        Set<String> active = activeAlertKeys != null
                ? activeAlertKeys.stream().filter(k -> k != null && !k.isBlank()).collect(Collectors.toSet())
                : Set.of();
        List<String> stale = repository.findByTenantIdAndUserId(tenantId, userId).stream()
                .map(ErpAlertDismissal::getAlertKey)
                .filter(key -> !active.contains(key))
                .toList();
        if (!stale.isEmpty()) {
            repository.deleteByTenantIdAndUserIdAndAlertKeyIn(tenantId, userId, stale);
        }
    }

    private UUID requireUserId() {
        UUID userId = UserContext.getUserIdOrNull();
        if (userId == null) {
            throw new IllegalStateException("Authenticated user required");
        }
        return userId;
    }
}
