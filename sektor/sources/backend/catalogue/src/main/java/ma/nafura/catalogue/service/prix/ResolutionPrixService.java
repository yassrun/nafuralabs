package ma.nafura.catalogue.service.prix;

import java.util.List;
import java.util.UUID;

public interface ResolutionPrixService {

    PrixResolu resoudrePrixAchat(UUID itemId, ContexteResolution ctx);

    List<PrixResolu> toutesLesSources(UUID itemId, ContexteResolution ctx);
}
