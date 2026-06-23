package ma.nafura.erp.onboarding.service;

import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.CreateTenantRequest;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.CreateTenantResponse;
import ma.nafura.platform.authorization.domain.model.TenantUserRole;
import ma.nafura.platform.authorization.repository.TenantUserRoleRepository;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import ma.nafura.platform.tenancy.domain.model.Tenant;
import ma.nafura.platform.tenancy.domain.model.TenantMembership;
import ma.nafura.platform.tenancy.repository.TenantMembershipRepository;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantProvisioningService {

    private static final String MEMBER_STATUS_ACTIVE = "ACTIVE";

    private final TenantRepository tenantRepository;
    private final TenantMembershipRepository tenantMembershipRepository;
    private final TenantUserRoleRepository tenantUserRoleRepository;
    private final AppUserRepository appUserRepository;
    private final OnboardingAccessTokenService accessTokenService;

    @Value("${nafura.application.id:erp}")
    private String applicationId;

    @Transactional
    public CreateTenantResponse createTenant(UUID ownerUserId, CreateTenantRequest request) {
        AppUser owner = appUserRepository.findById(ownerUserId)
            .orElseThrow(() -> new IllegalArgumentException("Owner user not found"));

        String tenantKey = buildUniqueTenantKey(request.companyName());
        Tenant tenant = tenantRepository.save(Tenant.builder()
            .key(tenantKey)
            .name(request.companyName().trim())
            .type("standard")
            .ownerEmail(owner.getEmail())
            .applicationId(applicationId)
            .build());

        tenantMembershipRepository.save(TenantMembership.builder()
            .tenantId(tenant.getId())
            .userId(ownerUserId)
            .status(MEMBER_STATUS_ACTIVE)
            .build());

        tenantUserRoleRepository.save(TenantUserRole.builder()
            .tenantId(tenant.getId())
            .userId(ownerUserId)
            .roleCode("OWNER")
            .build());

        log.info("Created tenant id={} key={} for user={}", tenant.getId(), tenantKey, ownerUserId);

        OnboardingAccessTokenService.IssuedToken issued =
            accessTokenService.issue(ownerUserId, owner.getEmail(), tenant.getId());
        String accessToken = issued.accessToken();
        long expiresIn = issued.expiresInSeconds();

        return new CreateTenantResponse(
            tenant.getId().toString(),
            tenant.getKey(),
            tenant.getName(),
            accessToken,
            expiresIn
        );
    }

    public void assertOwnerMembership(UUID tenantId, UUID userId) {
        if (!tenantMembershipRepository.existsByTenantIdAndUserId(tenantId, userId)) {
            throw new IllegalArgumentException("Not a member of this tenant");
        }
        boolean isOwner = tenantUserRoleRepository.findByTenantIdAndUserId(tenantId, userId).stream()
            .anyMatch(r -> "OWNER".equalsIgnoreCase(r.getRoleCode()));
        if (!isOwner) {
            throw new IllegalArgumentException("Only tenant owner can run onboarding preset");
        }
    }

    private String buildUniqueTenantKey(String companyName) {
        String base = Normalizer.normalize(companyName, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("^-|-$", "");
        if (base.isBlank()) {
            base = "societe";
        }
        if (base.length() > 40) {
            base = base.substring(0, 40);
        }
        String candidate = base;
        int suffix = 1;
        while (tenantRepository.findByKey(candidate).isPresent()) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }
}
