package ma.nafura.platform.administration.iam.config;

import ma.nafura.platform.administration.iam.roles.DeclaredRolesSeeder;
import ma.nafura.platform.administration.iam.service.port.InvitationEmailPort;
import ma.nafura.platform.administration.iam.service.port.NoOpInvitationEmailPort;
import ma.nafura.platform.authorization.repository.RolePermissionRepository;
import ma.nafura.platform.authorization.service.PermissionService;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@AutoConfiguration
public class NafuraIamAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    InvitationEmailPort invitationEmailPort() {
        return new NoOpInvitationEmailPort();
    }

    @Bean
    DeclaredRolesSeeder declaredRolesSeeder(RolePermissionRepository repository, PermissionService permissionService,
                                            PlatformTransactionManager transactionManager) {
        return new DeclaredRolesSeeder(repository, permissionService, new TransactionTemplate(transactionManager));
    }
}
