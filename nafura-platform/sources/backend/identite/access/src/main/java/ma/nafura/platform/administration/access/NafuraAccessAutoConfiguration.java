package ma.nafura.platform.administration.access;

import ma.nafura.platform.administration.access.roles.DeclaredRolesSeeder;
import ma.nafura.platform.authorization.repository.RolePermissionRepository;
import ma.nafura.platform.authorization.service.PermissionService;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/** Core (cap.access): declared roles are seeded in every application, whatever capabilities it removes. */
@AutoConfiguration
public class NafuraAccessAutoConfiguration {

    @Bean
    DeclaredRolesSeeder declaredRolesSeeder(RolePermissionRepository repository, PermissionService permissionService,
                                            PlatformTransactionManager transactionManager) {
        return new DeclaredRolesSeeder(repository, permissionService, new TransactionTemplate(transactionManager));
    }
}
