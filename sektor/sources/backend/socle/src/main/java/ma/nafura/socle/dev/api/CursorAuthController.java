package ma.nafura.socle.dev.api;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.socle.dev.config.CursorAuthProperties;
import ma.nafura.socle.dev.config.QaLocalConstants;
import ma.nafura.socle.onboarding.service.OnboardingAccessTokenService;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Local Mode B only: issue an HS256 session for a QA local identity (no Keycloak).
 * Default principal: {@link QaLocalConstants#OWNER_EMAIL} on tenant {@code qa-local}.
 * Opt-in: {@code ?email=} or {@code ?role=} on the allowlist (not auto-login).
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

    @GetMapping("/api/public/dev/cursor-identities")
    @PublicEndpoint(reason = "Local Cursor QA roster (flag-gated)")
    public ResponseEntity<CursorIdentitiesResponse> listIdentities() {
        List<CursorIdentity> users = new ArrayList<>();
        users.add(new CursorIdentity(
            QaLocalConstants.OWNER_ALIAS,
            QaLocalConstants.OWNER_EMAIL,
            QaLocalConstants.OWNER_NAME,
            "OWNER",
            true
        ));
        for (QaLocalConstants.RoleUser roleUser : QaLocalConstants.ROLE_USERS) {
            users.add(new CursorIdentity(
                roleUser.alias(),
                roleUser.email(),
                roleUser.name(),
                roleUser.tenantRoleCode(),
                false
            ));
        }
        return ResponseEntity.ok(new CursorIdentitiesResponse(QaLocalConstants.OWNER_EMAIL, users));
    }

    @PostMapping("/api/public/dev/cursor-session")
    @PublicEndpoint(reason = "Local Cursor QA auto-login (flag-gated)")
    public ResponseEntity<CursorSessionResponse> createSession(
        @RequestParam(required = false) String email,
        @RequestParam(required = false) String role
    ) {
        String resolved;
        try {
            resolved = QaLocalConstants.resolveSessionEmail(properties.getCursorAuthEmail(), email, role);
        } catch (IllegalArgumentException ex) {
            log.warn("QA local session refused: {}", ex.getMessage());
            return ResponseEntity.badRequest().build();
        }

        AppUser user = appUserRepository.findByEmailIgnoreCase(resolved).orElse(null);
        if (user == null) {
            log.warn("QA local user not found: {} (is cursor-auth enabled and boot provisioner ran?)", resolved);
            return ResponseEntity.notFound().build();
        }

        UUID tenantId = resolveTenantId(user.getId());
        if (tenantId == null) {
            log.warn("Cursor QA user {} has no ACTIVE tenant membership", resolved);
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
        boolean superAdmin = QaLocalConstants.isOwnerEmail(user.getEmail());

        OnboardingAccessTokenService.IssuedToken issued = accessTokenService.issue(
            user.getId(),
            user.getEmail(),
            tenantId,
            givenName,
            familyName,
            superAdmin
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
        List<TenantMembership> memberships = tenantMembershipRepository.findByUserId(userId).stream()
            .filter(m -> "ACTIVE".equalsIgnoreCase(m.getStatus()))
            .toList();
        if (memberships.isEmpty()) {
            return null;
        }
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

    public record CursorIdentity(
        String alias,
        String email,
        String name,
        String roleCode,
        boolean defaultLogin
    ) {}

    public record CursorIdentitiesResponse(String defaultEmail, List<CursorIdentity> users) {}
}
