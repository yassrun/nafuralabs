package ma.nafura.catalogue.service.port;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class NoOpTenantPrixHistoriquePortConfig {

    @Bean
    @ConditionalOnMissingBean(TenantPrixHistoriquePort.class)
    public TenantPrixHistoriquePort noOpTenantPrixHistoriquePort() {
        return itemId -> Optional.empty();
    }
}
