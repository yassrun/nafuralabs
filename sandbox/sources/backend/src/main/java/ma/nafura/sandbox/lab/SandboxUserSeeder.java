package ma.nafura.sandbox.lab;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import ma.nafura.platform.authorization.domain.model.UserRole;
import ma.nafura.platform.authorization.repository.UserRoleRepository;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.service.AppUserProvisioningService;

/**
 * Seeds lab identities (super admin + reader). Product-owned — not a platform seeder.
 */
@Component
@Order(50)
public class SandboxUserSeeder implements ApplicationRunner {

    private final AppUserProvisioningService appUserProvisioningService;
    private final UserRoleRepository userRoleRepository;

    public SandboxUserSeeder(
            AppUserProvisioningService appUserProvisioningService,
            UserRoleRepository userRoleRepository
    ) {
        this.appUserProvisioningService = appUserProvisioningService;
        this.userRoleRepository = userRoleRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (SandboxLabUsers.LabUser labUser : SandboxLabUsers.ALL) {
            AppUser user = appUserProvisioningService.provisionAuthenticatedUser(
                    labUser.email(),
                    labUser.givenName(),
                    labUser.familyName()
            );
            if (labUser.superAdmin() && !userRoleRepository.existsByUserIdAndRoleCode(user.getId(), "SUPER_ADMIN")) {
                userRoleRepository.save(UserRole.builder()
                        .userId(user.getId())
                        .roleCode("SUPER_ADMIN")
                        .build());
            }
        }
    }
}
