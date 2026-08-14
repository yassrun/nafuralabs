package ma.nafura.erp.dev.api;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.erp.dev.config.CursorAuthProperties;
import ma.nafura.erp.dev.config.QaLocalConstants;
import ma.nafura.erp.onboarding.service.OnboardingAccessTokenService;
import ma.nafura.platform.authorization.security.authorization.PublicEndpoint;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import ma.nafura.platform.tenancy.domain.model.Tenant;
import ma.nafura.platform.tenancy.domain.model.TenantMembership;
import ma.nafura.platform.tenancy.repository.TenantMembershipRepository;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Local Mode B only: issue an HS256 session for the QA local owner (no Keycloak).
 * Default principal: {@link QaLocalConstants#OWNER_EMAIL} on tenant {@code qa-local}.
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@ConditionalOnProperty(name = "nafura.dev.cursor-auth-enabled", havingValue = "true")
@EnableConfigurationProperties(CursorAuthProperties.class)
public class CursorAuthController {

    private final CursorAuthProperties properties;
    private final AppUserRepository appUserRepository;
    private final TenantMembershipRepository tenantMembershipRepository;
    private final TenantRepository tenantRepository;
    private final OnboardingAccessTokenService accessTokenService;

    @PostMapping("/api/public/dev/cursor-session")
    @PublicEndpoint(reason = "Local Cursor QA auto-login (flag-gated)")
    public ResponseEntity<CursorSessionResponse> createSession() {
        String email = resolveAuthEmail(properties.getCursorAuthEmail());
        AppUser user = appUserRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            log.warn("QA local user not found: {} (is cursor-auth enabled and boot provisioner ran?)", email);
            return ResponseEntity.notFound().build();
        }

        UUID tenantId = resolveTenantId(user.getId());
        if (tenantId == null) {
            log.warn("Cursor QA user {} has no ACTIVE tenant membership", email);
            return ResponseEntity.notFound().build();
        }

        Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
        if (tenant == null) {
            log.warn("Cursor QA tenant missing: {}", tenantId);
            return ResponseEntity.notFound().build();
        }

        String displayName = user.getName() != null ? user.getName().trim() : QaLocalConstants.OWNER_NAME;
        String[] parts = displayName.split("\\s+", 2);
        String givenName = parts.length > 0 ? parts[0] : "QA";
        String familyName = parts.length > 1 ? parts[1] : "Owner";

        OnboardingAccessTokenService.IssuedToken issued = accessTokenService.issue(
            user.getId(),
            user.getEmail(),
            tenantId,
            givenName,
            familyName,
            true
        );

        return ResponseEntity.ok(new CursorSessionResponse(
            issued.accessToken(),
            issued.expiresInSeconds(),
            user.getId().toString(),
            user.getEmail(),
            givenName,
            familyName,
            tenant.getId().toString(),
            tenant.getName(),
            tenant.getKey() != null ? tenant.getKey() : tenant.getId().toString()
        ));
    }

    /** Prefer {@code qa@…}; remap deprecated {@code cursor.qa@…}. */
    static String resolveAuthEmail(String configured) {
        if (!StringUtils.hasText(configured)
            || QaLocalConstants.DEPRECATED_CURSOR_QA_EMAIL.equalsIgnoreCase(configured.trim())) {
            return QaLocalConstants.OWNER_EMAIL;
        }
        return configured.trim();
    }

    private UUID resolveTenantId(UUID userId) {
        if (StringUtils.hasText(properties.getCursorAuthTenantId())) {
            try {
                UUID configured = UUID.fromString(properties.getCursorAuthTenantId().trim());
                return tenantMembershipRepository
                    .findByTenantIdAndUserId(configured, userId)
                    .filter(m -> "ACTIVE".equalsIgnoreCase(m.getStatus()))
                    .map(TenantMembership::getTenantId)
                    .orElse(null);
            } catch (IllegalArgumentException ex) {
                log.warn("Invalid nafura.dev.cursor-auth-tenant-id: {}", properties.getCursorAuthTenantId());
                return null;
            }
        }
        List<TenantMembership> memberships = tenantMembershipRepository.findByUserId(userId).stream()
            .filter(m -> "ACTIVE".equalsIgnoreCase(m.getStatus()))
            .toList();
        if (memberships.isEmpty()) {
            return null;
        }
        // Prefer dedicated QA tenant when several memberships exist.
        for (TenantMembership membership : memberships) {
            Tenant tenant = tenantRepository.findById(membership.getTenantId()).orElse(null);
            if (tenant != null && QaLocalConstants.TENANT_KEY.equalsIgnoreCase(tenant.getKey())) {
                return tenant.getId();
            }
        }
        return memberships.get(0).getTenantId();
    }

    public record CursorSessionResponse(
        String accessToken,
        long expiresIn,
        String userId,
        String email,
        String firstName,
        String lastName,
        String tenantId,
        String tenantName,
        String tenantSlug
    ) {}
}
