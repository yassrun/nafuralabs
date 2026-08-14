package ma.nafura.etudes.service.port.bc;

import java.util.List;
import ma.nafura.etudes.api.dto.CatalogCandidateDto;

public interface CatalogResolverPort {

    List<CatalogCandidateDto> resolve(String designation, String type, int limit);
}
