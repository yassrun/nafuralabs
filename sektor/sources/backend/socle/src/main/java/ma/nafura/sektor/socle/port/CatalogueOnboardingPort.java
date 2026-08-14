package ma.nafura.sektor.socle.port;

import java.util.UUID;

/** Port socle : seed référentiel + articles. Impl dans catalogue. */
public interface CatalogueOnboardingPort {

    void seedReferenceData(UUID tenantId);

    void seedArticles(UUID tenantId, String secteur);

    boolean hasArticles(UUID tenantId);
}
