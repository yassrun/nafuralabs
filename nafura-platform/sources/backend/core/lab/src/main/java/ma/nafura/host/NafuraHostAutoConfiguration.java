package ma.nafura.host;

import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.validation.Validator;
import ma.nafura.host.seed.SeedCatalog;
import ma.nafura.host.seed.SeedRunner;
import ma.nafura.host.seed.TenantSeeder;
import ma.nafura.platform.framework.record.LifecycleEngine;
import ma.nafura.platform.identity.repository.AppUserRepository;
import ma.nafura.platform.identity.service.AppUserProvisioningService;
import ma.nafura.platform.scope.security.scope.DefaultScopeService;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;

/** What every product needs whatever the environment (lab or cluster). */
@AutoConfiguration
public class NafuraHostAutoConfiguration {

    /** Demo data follows the lab unless the environment says otherwise (staging: on); never in prod. */
    @Bean
    TenantSeeder tenantSeeder(
            @Value("${nafura.seed.demo:${nafura.lab.enabled:false}}") boolean demo,
            Environment environment,
            ResourcePatternResolver resources,
            JsonMapper jsonMapper,
            EntityManager entityManager,
            PlatformTransactionManager transactionManager,
            JdbcTemplate jdbcTemplate,
            Validator validator,
            LifecycleEngine lifecycles
    ) {
        if (demo && environment.acceptsProfiles(Profiles.of("prod"))) {
            throw new IllegalStateException("nafura.seed.demo=true is forbidden with the 'prod' profile");
        }
        return new TenantSeeder(SeedCatalog.load(resources, jsonMapper), demo, entityManager,
                new TransactionTemplate(transactionManager), jdbcTemplate, validator, lifecycles, jsonMapper);
    }

    @Bean
    SeedRunner seedRunner(TenantSeeder tenantSeeder, TenantRepository tenantRepository) {
        return new SeedRunner(tenantSeeder, tenantRepository);
    }

    @Bean
    @ConditionalOnProperty(name = "nafura.security.tenant.mode", havingValue = "single")
    SingleScopeBootstrap singleScopeBootstrap(
            @Value("${nafura.application.id:app}") String applicationId,
            @Value("${nafura.application.name:${nafura.application.id:app}}") String applicationName,
            @Value("${nafura.access.owners:}") List<String> owners,
            DefaultScopeService defaultScopeService,
            TenantRepository tenantRepository,
            AppUserRepository appUserRepository,
            AppUserProvisioningService appUserProvisioningService,
            JdbcTemplate jdbcTemplate
    ) {
        return new SingleScopeBootstrap(applicationId, applicationName, owners, defaultScopeService, tenantRepository,
                appUserRepository, appUserProvisioningService, jdbcTemplate);
    }
}
