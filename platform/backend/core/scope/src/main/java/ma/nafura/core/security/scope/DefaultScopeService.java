package ma.nafura.platform.scope.security.scope;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.scope.domain.model.AppScope;
import ma.nafura.platform.scope.repository.AppScopeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Resolves the default scope for non-tenant/single-scope applications.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DefaultScopeService {

    private static final String DEFAULT_SCOPE_TYPE = "APP_DEFAULT";

    private final AppScopeRepository appScopeRepository;

    @Value("${nafura.application.id:app}")
    private String applicationId;

    private volatile UUID cachedDefaultScopeId;

    @Transactional
    public UUID resolveDefaultScopeId() {
        UUID cached = cachedDefaultScopeId;
        if (cached != null) {
            return cached;
        }

        synchronized (this) {
            if (cachedDefaultScopeId != null) {
                return cachedDefaultScopeId;
            }

            String appId = normalizedApplicationId();
            String scopeKey = defaultScopeKey(appId);
            UUID scopeId = appScopeRepository.findByApplicationIdAndScopeKey(appId, scopeKey)
                    .map(AppScope::getId)
                    .orElseGet(() -> createDefaultScope(appId, scopeKey).getId());

            cachedDefaultScopeId = scopeId;
            return scopeId;
        }
    }

    private AppScope createDefaultScope(String appId, String scopeKey) {
        AppScope scope = AppScope.builder()
                .scopeKey(scopeKey)
                .name(defaultScopeName(appId))
                .type(DEFAULT_SCOPE_TYPE)
                .applicationId(appId)
                .build();

        try {
            AppScope saved = appScopeRepository.save(scope);
            log.info("Created default scope '{}' for application '{}' ({})", saved.getScopeKey(), appId, saved.getId());
            return saved;
        } catch (DataIntegrityViolationException ex) {
            return appScopeRepository.findByApplicationIdAndScopeKey(appId, scopeKey).orElseThrow(() -> ex);
        }
    }

    private String defaultScopeKey(String appId) {
        return "default-" + appId;
    }

    private String defaultScopeName(String appId) {
        return appId + " Default Scope";
    }

    private String normalizedApplicationId() {
        if (applicationId == null || applicationId.isBlank()) {
            return "app";
        }
        return applicationId.trim().toLowerCase();
    }
}

