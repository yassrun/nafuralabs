package ma.nafura.socle.chrome.config;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.sektor.socle.port.bc.ErpChromeHsePort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnMissingBean(ErpChromeHsePort.class)
public class NoOpErpChromeHsePort implements ErpChromeHsePort {

    @Override
    public List<ExpiringFormation> expiringFormations(UUID tenantId, LocalDate from, LocalDate to) {
        return List.of();
    }
}
