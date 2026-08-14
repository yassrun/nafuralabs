package ma.nafura.socle.onboarding.config;

import ma.nafura.socle.config.DemoSeedProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({OnboardingProperties.class, DemoSeedProperties.class})
@org.springframework.context.annotation.Import(OnboardingDevSecurityConfiguration.class)
public class OnboardingAutoConfiguration {
}
