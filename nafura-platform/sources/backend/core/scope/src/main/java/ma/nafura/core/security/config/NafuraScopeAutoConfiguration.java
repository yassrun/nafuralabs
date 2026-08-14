package ma.nafura.platform.scope.security.config;

import ma.nafura.platform.scope.security.scope.DefaultScopeService;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

@AutoConfiguration(before = SecurityAutoConfiguration.class)
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnProperty(name = "nafura.security.enabled", havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties(TenantScopeProperties.class)
public class NafuraScopeAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public TenantContextInitializer tenantContextInitializer(TenantScopeProperties tenantScopeProperties) {
        return new TenantContextInitializer(tenantScopeProperties);
    }

    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(name = "nafura.security.tenant.enabled", havingValue = "true", matchIfMissing = true)
    @ConditionalOnExpression(
            "'${nafura.security.tenant.mode:multi}'.equalsIgnoreCase('none') || " +
            "'${nafura.security.tenant.mode:multi}'.equalsIgnoreCase('single')")
    public FixedScopeTenantContextFilter fixedScopeTenantContextFilter(
            TenantScopeProperties tenantScopeProperties,
            DefaultScopeService defaultScopeService) {
        return new FixedScopeTenantContextFilter(tenantScopeProperties, defaultScopeService);
    }
}

