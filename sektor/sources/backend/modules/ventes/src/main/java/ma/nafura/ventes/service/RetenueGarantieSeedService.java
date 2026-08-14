package ma.nafura.ventes.service;

import java.util.UUID;
import ma.nafura.ventes.repository.RetenueGarantieRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RetenueGarantieSeedService {

    private final RetenueGarantieRepository repository;

    public RetenueGarantieSeedService(RetenueGarantieRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
    }
}
