package ma.nafura.etudes.api.dto;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class DossierAgentSuggestionDto {

    UUID id;
    String actionType;
    String libelle;
    String etat;
    String acteur;
    OffsetDateTime date;
    String correctionNote;
    String provenanceJson;
}
