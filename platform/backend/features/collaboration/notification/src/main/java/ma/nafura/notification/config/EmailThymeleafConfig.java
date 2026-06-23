package ma.nafura.platform.collaboration.notification.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.StringTemplateResolver;

/**
 * Thymeleaf configuration for email template processing (string-based, in-memory).
 * Bean name avoids conflict with doc-manager's stringTemplateEngine.
 */
@Configuration
public class EmailThymeleafConfig {

    @Bean(name = "emailTemplateEngine")
    public TemplateEngine emailTemplateEngine() {
        TemplateEngine engine = new TemplateEngine();
        StringTemplateResolver resolver = new StringTemplateResolver();
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCacheable(false);
        engine.setTemplateResolver(resolver);
        return engine;
    }
}
