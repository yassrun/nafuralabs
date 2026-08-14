package ma.nafura.platform.authorization.security.config;

import ma.nafura.platform.tenancy.repository.TenantMembershipRepository;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import ma.nafura.platform.authorization.repository.TenantUserRoleRepository;
import ma.nafura.platform.authorization.security.authorization.PublicEndpointRegistry;
import ma.nafura.platform.authorization.security.jwt.JwtTokenExtractor;
import ma.nafura.platform.authorization.security.properties.SecurityProperties;
import ma.nafura.platform.authorization.service.UserPermissionContextService;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.context.annotation.Bean;

@AutoConfiguration(before = SecurityAutoConfiguration.class)
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnProperty(name = "nafura.security.enabled", havingValue = "true", matchIfMissing = true)
public class NafuraTenantSecurityAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(name = "nafura.security.tenant.enabled", havingValue = "true", matchIfMissing = true)
    @ConditionalOnExpression("'${nafura.security.tenant.mode:multi}'.equalsIgnoreCase('multi')")
    public TenantContextFilter tenantContextFilter(
            TenantRepository tenantRepository,
            TenantMembershipRepository tenantMembershipRepository,
            TenantUserRoleRepository tenantUserRoleRepository,
            PublicEndpointRegistry publicEndpointRegistry,
            JwtTokenExtractor jwtTokenExtractor,
            SecurityProperties securityProperties,
            UserPermissionContextService userPermissionContextService) {
        return new TenantContextFilter(
                tenantRepository,
                tenantMembershipRepository,
                tenantUserRoleRepository,
                publicEndpointRegistry,
                jwtTokenExtractor,
                securityProperties,
                userPermissionContextService
        );
    }
}


