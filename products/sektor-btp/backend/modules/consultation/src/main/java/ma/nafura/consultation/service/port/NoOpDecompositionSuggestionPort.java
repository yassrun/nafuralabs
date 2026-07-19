package ma.nafura.consultation.service.port;

import java.util.List;
import ma.nafura.consultation.api.request.ImportComposantDto;
import ma.nafura.consultation.domain.model.ConsultationNoeud;
import org.springframework.stereotype.Component;

/** Default: no suggestion; the expert builds the decomposition manually. A real
 * adapter should be declared {@code @Primary} to override this. */
@Component
public class NoOpDecompositionSuggestionPort implements DecompositionSuggestionPort {

    @Override
    public boolean isAvailable() {
        return false;
    }

    @Override
    public List<ImportComposantDto> suggest(ConsultationNoeud poste) {
        return List.of();
    }
}
