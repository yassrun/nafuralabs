package ma.nafura.erp.dev.api;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.erp.dev.config.CursorAuthProperties;
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
 * Local Mode B only: issue an HS256 session for the seeded Cursor QA user (no Keycloak).
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
        String email = properties.getCursorAuthEmail();
        AppUser user = appUserRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            log.warn("Cursor QA user not found: {}", email);
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

        String displayName = user.getName() != null ? user.getName().trim() : "Cursor QA";
        String[] parts = displayName.split("\\s+", 2);
        String givenName = parts.length > 0 ? parts[0] : "Cursor";
        String familyName = parts.length > 1 ? parts[1] : "QA";

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
        List<TenantMembership> memberships = tenantMembershipRepository.findByUserId(userId);
        return memberships.stream()
            .filter(m -> "ACTIVE".equalsIgnoreCase(m.getStatus()))
            .map(TenantMembership::getTenantId)
            .findFirst()
            .orElse(null);
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
