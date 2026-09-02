package ma.nafura.socle.chrome.config;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.sektor.socle.port.bc.ErpChromeMarchesPort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnMissingBean(ErpChromeMarchesPort.class)
public class NoOpErpChromeMarchesPort implements ErpChromeMarchesPort {

    @Override
    public List<OverdueInvoice> overdueInvoices(UUID tenantId, LocalDate today) {
        return List.of();
    }

    @Override
    public List<ExpiringCaution> expiringCautions(UUID tenantId, LocalDate today, int days) {
        return List.of();
    }
}
