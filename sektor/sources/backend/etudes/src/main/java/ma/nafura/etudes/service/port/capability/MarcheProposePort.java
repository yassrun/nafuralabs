package ma.nafura.etudes.service.port.capability;

import java.util.List;
import java.util.Optional;
import ma.nafura.etudes.api.dto.MarcheProposeDto;
import ma.nafura.etudes.domain.cps.CpsSection;

/**
 * Propose métadonnées marché + checklist pièces à partir des sections CPS indexées.
 *
 * <p>Suggestion reviewable uniquement — jamais persistée sans apply explicite.
 */
public interface MarcheProposePort {

    boolean isAvailable();

    Optional<MarcheProposeDto> proposer(List<CpsSection> sections);
}
