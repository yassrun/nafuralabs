package ma.nafura.catalogue.service.port.bc;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.catalogue.service.prix.ContexteResolution;
import ma.nafura.catalogue.service.prix.PrixCandidat;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

/**
 * Fallback quand le module achats n'est pas sur le classpath (tests unitaires item).
 */
@Component
@ConditionalOnMissingBean(PrixAchatExternePort.class)
public class NoOpPrixAchatExternePort implements PrixAchatExternePort {

    @Override
    public Optional<PrixCandidat> findOffreRetenue(UUID itemId, ContexteResolution ctx) {
        return Optional.empty();
    }

    @Override
    public Optional<PrixCandidat> findContrat(UUID itemId, ContexteResolution ctx) {
        return Optional.empty();
    }

    @Override
    public Optional<PrixCandidat> findCatalogue(UUID itemId, ContexteResolution ctx) {
        return Optional.empty();
    }

    @Override
    public Optional<PrixCandidat> findDerniereFacture(UUID itemId, ContexteResolution ctx) {
        return Optional.empty();
    }

    @Override
    public List<PrixCandidat> allSources(UUID itemId, ContexteResolution ctx) {
        return List.of();
    }
}
