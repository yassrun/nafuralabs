package ma.nafura.etudes.service.port;

import java.util.List;
import ma.nafura.etudes.api.request.ComposantDpuInputDto;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import org.springframework.stereotype.Component;

@Component
public class NoOpDecompositionSuggestionPort implements DecompositionSuggestionPort {

    @Override
    public boolean isAvailable() {
        return false;
    }

    @Override
    public List<ComposantDpuInputDto> suggest(DpgfNoeud article) {
        return List.of();
    }
}
