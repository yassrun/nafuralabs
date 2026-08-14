package ma.nafura.ventes.service;

import java.util.UUID;
import ma.nafura.ventes.repository.FactureClientRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FactureClientSeedService {

    private final FactureClientRepository repository;

    public FactureClientSeedService(FactureClientRepository repository) {
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
