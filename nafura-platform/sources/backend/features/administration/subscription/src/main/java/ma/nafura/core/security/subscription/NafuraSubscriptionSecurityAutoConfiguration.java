package ma.nafura.platform.subscription.security.subscription;

import ma.nafura.platform.subscription.service.SubscriptionEntitlementService;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.HandlerMapping;

import java.util.List;

@AutoConfiguration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnProperty(name = "nafura.security.subscription-enforcement.enabled", havingValue = "true", matchIfMissing = true)
public class NafuraSubscriptionSecurityAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public EntitlementEnforcementFilter entitlementEnforcementFilter(
            List<HandlerMapping> handlerMappings,
            SubscriptionEntitlementService subscriptionEntitlementService) {
        return new EntitlementEnforcementFilter(handlerMappings, subscriptionEntitlementService);
    }
}

