package ma.nafura.platform.collaboration.audit;

import org.hibernate.cfg.AvailableSettings;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AuditableHibernateConfig {

    @Bean
    public HibernatePropertiesCustomizer auditableInterceptorCustomizer(
            AuditableHibernateInterceptor interceptor) {
        return props -> props.put(AvailableSettings.INTERCEPTOR, interceptor);
    }
}
