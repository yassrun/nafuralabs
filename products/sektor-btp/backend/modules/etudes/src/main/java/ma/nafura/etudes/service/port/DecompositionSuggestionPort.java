package ma.nafura.etudes.service.port;

import java.util.List;
import ma.nafura.etudes.api.request.ComposantDpuInputDto;
import ma.nafura.etudes.domain.model.DpgfNoeud;

/**
 * Suggère la décomposition d'un ARTICLE (rendements).
 * v1 = No-Op.
 */
public interface DecompositionSuggestionPort {

    boolean isAvailable();

    List<ComposantDpuInputDto> suggest(DpgfNoeud article);
}
