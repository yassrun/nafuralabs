package ma.nafura.lab;

import ma.nafura.platform.authorization.repository.UserRoleRepository;
import ma.nafura.platform.identity.repository.AppUserRepository;
import ma.nafura.platform.identity.service.AppUserProvisioningService;
import ma.nafura.platform.scope.security.scope.DefaultScopeService;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.jdbc.core.JdbcTemplate;

/** Mock login + seeded tenant/users for local products. Mints tokens without a password: never in prod. */
@AutoConfiguration
@ConditionalOnProperty(name = "nafura.lab.enabled", havingValue = "true")
@EnableConfigurationProperties(LabProperties.class)
public class NafuraLabAutoConfiguration {

    public NafuraLabAutoConfiguration(Environment environment) {
        if (environment.acceptsProfiles(Profiles.of("prod"))) {
            throw new IllegalStateException("nafura.lab.enabled=true is forbidden with the 'prod' profile");
        }
    }

    @Bean
    LabSessionController labSessionController(
            LabProperties properties,
            @Value("${nafura.security.jwt.hs256-secret}") String hs256Secret,
            AppUserRepository appUserRepository,
            DefaultScopeService defaultScopeService
    ) {
        return new LabSessionController(properties, hs256Secret, appUserRepository, defaultScopeService);
    }

    @Bean
    LabSeeder labSeeder(
            LabProperties properties,
            @Value("${nafura.application.id:lab}") String applicationId,
            DefaultScopeService defaultScopeService,
            TenantRepository tenantRepository,
            JdbcTemplate jdbcTemplate,
            AppUserProvisioningService appUserProvisioningService,
            UserRoleRepository userRoleRepository
    ) {
        return new LabSeeder(properties, applicationId, defaultScopeService, tenantRepository, jdbcTemplate,
                appUserProvisioningService, userRoleRepository);
    }
}
