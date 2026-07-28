package ma.nafura.erp.onboarding.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(OnboardingProperties.class)
@org.springframework.context.annotation.Import(OnboardingDevSecurityConfiguration.class)
public class OnboardingAutoConfiguration {
}
