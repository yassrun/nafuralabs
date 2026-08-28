package ma.nafura.etudes.api.dto;

import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class DossierAgentContextDto {

    UUID dossierId;
    String numero;
    String objet;
    List<DossierAgentProvenanceEtapeDto> provenance;
    List<DossierAgentSuggestionDto> journal;
    boolean chatGenerique;
}
