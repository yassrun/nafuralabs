package ma.nafura.erp.dev.config;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.ApplyPresetRequest;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.SocietePresetDto;
import ma.nafura.erp.onboarding.service.TenantPresetOrchestratorService;
import ma.nafura.platform.appsettings.domain.model.TenantSetting;
import ma.nafura.platform.appsettings.repository.TenantSettingRepository;
import ma.nafura.platform.authorization.domain.model.TenantUserRole;
import ma.nafura.platform.authorization.domain.model.UserRole;
import ma.nafura.platform.authorization.repository.TenantUserRoleRepository;
import ma.nafura.platform.authorization.repository.UserRoleRepository;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import ma.nafura.platform.tenancy.domain.model.Tenant;
import ma.nafura.platform.tenancy.domain.model.TenantMembership;
import ma.nafura.platform.tenancy.repository.TenantMembershipRepository;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Local Mode B only: provision tenant {@code qa-local} + owner {@code qa@…}
 * and run the same onboarding preset as a real owner (including {@code seedReferenceData}).
 */
@Slf4j
@Component
@Order(100)
@RequiredArgsConstructor
@ConditionalOnProperty(name = "nafura.dev.cursor-auth-enabled", havingValue = "true")
public class QaLocalProvisioner implements ApplicationRunner {

    private static final String MEMBER_ACTIVE = "ACTIVE";
    private static final String QA_ICE = "000000000000001";

    private final AppUserRepository appUserRepository;
    private final TenantRepository tenantRepository;
    private final TenantMembershipRepository tenantMembershipRepository;
    private final UserRoleRepository userRoleRepository;
    private final TenantUserRoleRepository tenantUserRoleRepository;
    private final TenantSettingRepository tenantSettingRepository;
    private final TenantPresetOrchestratorService presetOrchestrator;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        AppUser owner = ensureOwner();
        Tenant tenant = ensureTenant(owner);
        ensureMembership(tenant.getId(), owner.getId());
        ensureGlobalRole(owner.getId(), "SUPER_ADMIN");
        ensureTenantRole(tenant.getId(), owner.getId(), "OWNER");
        ensureTenantRole(tenant.getId(), owner.getId(), "SUPER_ADMIN");
        ensureTenantRole(tenant.getId(), owner.getId(), "BTP_INGENIEUR");
        upsertSetting(tenant.getId(), "etudes.auteurPeutValider", "true");

        ApplyPresetRequest preset = new ApplyPresetRequest(
            new SocietePresetDto(QaLocalConstants.TENANT_NAME, QA_ICE, "SARL"),
            "BATIMENT",
            "M",
            "MIXTE",
            "INTERNE",
            false
        );
        var applied = presetOrchestrator.applyPreset(tenant.getId(), preset);
        log.info(
            "QA local ready tenant={} key={} owner={} steps={}",
            tenant.getId(),
            tenant.getKey(),
            owner.getEmail(),
            applied.completedSteps()
        );
    }

    private AppUser ensureOwner() {
        return appUserRepository.findByEmailIgnoreCase(QaLocalConstants.OWNER_EMAIL)
            .map(existing -> {
                if (!QaLocalConstants.OWNER_NAME.equals(existing.getName())
                    || !"ACTIVE".equalsIgnoreCase(existing.getStatus())) {
                    existing.setName(QaLocalConstants.OWNER_NAME);
                    existing.setStatus("ACTIVE");
                    return appUserRepository.save(existing);
                }
                return existing;
            })
            .orElseGet(() -> appUserRepository.save(AppUser.builder()
                .email(QaLocalConstants.OWNER_EMAIL)
                .name(QaLocalConstants.OWNER_NAME)
                .status("ACTIVE")
                .build()));
    }

    private Tenant ensureTenant(AppUser owner) {
        return tenantRepository.findByKey(QaLocalConstants.TENANT_KEY)
            .map(existing -> {
                boolean dirty = false;
                if (!QaLocalConstants.TENANT_NAME.equals(existing.getName())) {
                    existing.setName(QaLocalConstants.TENANT_NAME);
                    dirty = true;
                }
                if (!QaLocalConstants.OWNER_EMAIL.equalsIgnoreCase(existing.getOwnerEmail())) {
                    existing.setOwnerEmail(owner.getEmail());
                    dirty = true;
                }
                return dirty ? tenantRepository.save(existing) : existing;
            })
            .orElseGet(() -> tenantRepository.save(Tenant.builder()
                .key(QaLocalConstants.TENANT_KEY)
                .name(QaLocalConstants.TENANT_NAME)
                .type("standard")
                .ownerEmail(owner.getEmail())
                .applicationId(QaLocalConstants.APPLICATION_ID)
                .build()));
    }

    private void ensureMembership(UUID tenantId, UUID userId) {
        tenantMembershipRepository.findByTenantIdAndUserId(tenantId, userId)
            .ifPresentOrElse(existing -> {
                if (!MEMBER_ACTIVE.equalsIgnoreCase(existing.getStatus())) {
                    existing.setStatus(MEMBER_ACTIVE);
                    tenantMembershipRepository.save(existing);
                }
            }, () -> tenantMembershipRepository.save(TenantMembership.builder()
                .tenantId(tenantId)
                .userId(userId)
                .status(MEMBER_ACTIVE)
                .build()));
    }

    private void ensureGlobalRole(UUID userId, String roleCode) {
        if (userRoleRepository.existsByUserIdAndRoleCode(userId, roleCode)) {
            return;
        }
        userRoleRepository.save(UserRole.builder()
            .userId(userId)
            .roleCode(roleCode)
            .build());
    }

    private void ensureTenantRole(UUID tenantId, UUID userId, String roleCode) {
        List<TenantUserRole> roles = tenantUserRoleRepository.findByTenantIdAndUserId(tenantId, userId);
        boolean present = roles.stream().anyMatch(r -> roleCode.equalsIgnoreCase(r.getRoleCode()));
        if (present) {
            return;
        }
        tenantUserRoleRepository.save(TenantUserRole.builder()
            .tenantId(tenantId)
            .userId(userId)
            .roleCode(roleCode)
            .build());
    }

    private void upsertSetting(UUID tenantId, String key, String value) {
        tenantSettingRepository.findByTenantIdAndSettingKey(tenantId, key)
            .ifPresentOrElse(existing -> {
                if (!value.equals(existing.getValue())) {
                    existing.setValue(value);
                    tenantSettingRepository.save(existing);
                }
            }, () -> tenantSettingRepository.save(TenantSetting.builder()
                .tenantId(tenantId)
                .settingKey(key)
                .value(value)
                .build()));
    }
}
