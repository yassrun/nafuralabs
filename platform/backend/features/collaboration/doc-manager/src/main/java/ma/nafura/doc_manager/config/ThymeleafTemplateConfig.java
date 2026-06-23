package ma.nafura.platform.collaboration.docmanager.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.StringTemplateResolver;

/**
 * Thymeleaf configuration for in-memory (string) template processing.
 */
@Configuration
public class ThymeleafTemplateConfig {

    @Bean(name = "stringTemplateEngine")
    public TemplateEngine stringTemplateEngine() {
        TemplateEngine engine = new TemplateEngine();
        StringTemplateResolver resolver = new StringTemplateResolver();
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCacheable(false);
        engine.setTemplateResolver(resolver);
        return engine;
    }
}
