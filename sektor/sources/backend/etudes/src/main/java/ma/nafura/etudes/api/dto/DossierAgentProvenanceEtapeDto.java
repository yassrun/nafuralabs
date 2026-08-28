package ma.nafura.etudes.api.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class DossierAgentProvenanceEtapeDto {

    String etape;
    String libelle;
    String reference;
    String source;
}
