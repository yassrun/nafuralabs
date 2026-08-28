package ma.nafura.chantiers.service;

import ma.nafura.achats.repository.DemandeAchatRepository;
import ma.nafura.chantiers.service.port.DemandeAchatCockpitPort;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/** SEKTOR-227 — compte les DA du chantier via le repository Achats. */
@Component
public class DemandeAchatCockpitAdapter implements DemandeAchatCockpitPort {

    private final DemandeAchatRepository repository;

    public DemandeAchatCockpitAdapter(DemandeAchatRepository repository) {
        this.repository = repository;
    }

    @Override
    public long compterParChantier(String chantierId) {
        if (!StringUtils.hasText(chantierId)) {
            return 0L;
        }
        return repository.countByTenantIdAndChantierId(
                TenantContext.getTenantId(), chantierId.trim());
    }
}
