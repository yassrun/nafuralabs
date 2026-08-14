package ma.nafura.platform.authorization.security.config;

import ma.nafura.platform.authorization.apikey.ApiKeyAuthenticationFilter;
import ma.nafura.platform.authorization.apikey.ApiKeyProperties;
import ma.nafura.platform.authorization.apikey.ApiKeyService;
import ma.nafura.platform.authorization.repository.UserRoleRepository;
import ma.nafura.platform.tenancy.repository.TenantMembershipRepository;
import ma.nafura.platform.authorization.repository.TenantUserRoleRepository;
import ma.nafura.platform.authorization.security.authorization.PermissionEnforcementFilter;
import ma.nafura.platform.authorization.security.jwt.JwtTokenExtractor;
import ma.nafura.platform.authorization.security.properties.SecurityProperties;
import ma.nafura.platform.identity.service.AppUserProvisioningService;
import ma.nafura.platform.authorization.service.UserPermissionContextService;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.web.servlet.HandlerMapping;

import java.util.List;

/**
 * Auto-configuration for Nafura security components.
 * 
 * <p>This configuration is automatically applied when:
 * <ul>
 *   <li>It's a web application</li>
 *   <li>Spring Security is on the classpath</li>
 *   <li>The property nafura.security.enabled is true (default)</li>
 * </ul>
 * 
 * <p>To disable, set in application.yml:
 * <pre>
 * nafura:
 *   security:
 *     enabled: false
 * </pre>
 * 
 */
@AutoConfiguration(before = SecurityAutoConfiguration.class)
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnProperty(name = "nafura.security.enabled", havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties({SecurityProperties.class, ApiKeyProperties.class})
@Import(SecurityConfig.class)
public class NafuraSecurityAutoConfiguration {
    
    /**
     * JWT token extractor utility bean.
     */
    @Bean
    @ConditionalOnMissingBean
    public JwtTokenExtractor jwtTokenExtractor() {
        return new JwtTokenExtractor();
    }

    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(name = "nafura.security.api-keys.enabled", havingValue = "true", matchIfMissing = true)
    public ApiKeyAuthenticationFilter apiKeyAuthenticationFilter(ApiKeyService apiKeyService) {
        return new ApiKeyAuthenticationFilter(apiKeyService);
    }

    /**
     * User context filter bean.
     * Loads user identity context for both mono-tenant and multi-tenant applications.
     */
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(name = "nafura.security.user-context.enabled", havingValue = "true", matchIfMissing = true)
    public UserContextFilter userContextFilter(
            UserRoleRepository userRoleRepository,
            TenantMembershipRepository tenantMembershipRepository,
            TenantUserRoleRepository tenantUserRoleRepository,
            JwtTokenExtractor jwtTokenExtractor,
            AppUserProvisioningService appUserProvisioningService,
            UserPermissionContextService userPermissionContextService) {
        return new UserContextFilter(
                userRoleRepository,
                tenantMembershipRepository,
                tenantUserRoleRepository,
                jwtTokenExtractor,
                appUserProvisioningService,
                userPermissionContextService);
    }

    /**
     * Permission enforcement filter bean.
     * Enforces @SecuredResource and @RequirePermission annotations on controllers.
     */
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(name = "nafura.security.permission-enforcement.enabled", havingValue = "true", matchIfMissing = true)
    public PermissionEnforcementFilter permissionEnforcementFilter(
            List<HandlerMapping> handlerMappings) {
        return new PermissionEnforcementFilter(handlerMappings);
    }
}


