package ma.nafura.consultation.service.port;

import java.util.List;
import ma.nafura.consultation.api.request.ImportComposantDto;
import ma.nafura.consultation.domain.model.ConsultationNoeud;

/**
 * Suggests the decomposition (materials + services) of a POSTE. v1 default is
 * a No-Op (expert builds it manually); a future adapter proposes composants
 * that the expert then adjusts.
 */
public interface DecompositionSuggestionPort {

    boolean isAvailable();

    List<ImportComposantDto> suggest(ConsultationNoeud poste);
}
