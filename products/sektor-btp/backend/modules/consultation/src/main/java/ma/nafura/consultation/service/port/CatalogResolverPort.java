package ma.nafura.consultation.service.port;

import java.util.List;
import ma.nafura.consultation.api.dto.CatalogCandidateDto;

/**
 * Resolves a designation against the {@code items} catalog and returns
 * candidate matches. The v1 default is substring matching; a future adapter
 * can swap in embedding / fuzzy matching without touching callers.
 */
public interface CatalogResolverPort {

    List<CatalogCandidateDto> resolve(String designation, String type, int limit);
}
