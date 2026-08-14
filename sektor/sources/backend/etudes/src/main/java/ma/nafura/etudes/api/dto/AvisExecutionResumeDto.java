package ma.nafura.etudes.api.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AvisExecutionResumeDto {
    long ouverts;
    long ecartes;
    long prisEnCompte;
    long total;
}
