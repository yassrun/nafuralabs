package ma.nafura.catalogue.service.port.bc;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.catalogue.service.prix.ContexteResolution;
import ma.nafura.catalogue.service.prix.PrixCandidat;

/**
 * Port vers les sources de prix d'achat gérées par le module {@code achats}.
 * Implémentation : {@code AchatsPrixAchatExterneAdapter}.
 */
public interface PrixAchatExternePort {

    Optional<PrixCandidat> findOffreRetenue(UUID itemId, ContexteResolution ctx);

    Optional<PrixCandidat> findContrat(UUID itemId, ContexteResolution ctx);

    Optional<PrixCandidat> findCatalogue(UUID itemId, ContexteResolution ctx);

    Optional<PrixCandidat> findDerniereFacture(UUID itemId, ContexteResolution ctx);

    List<PrixCandidat> allSources(UUID itemId, ContexteResolution ctx);
}
