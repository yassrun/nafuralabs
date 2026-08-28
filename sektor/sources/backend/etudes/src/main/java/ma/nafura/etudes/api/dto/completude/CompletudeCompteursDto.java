package ma.nafura.etudes.api.dto.completude;

import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class CompletudeCompteursDto {

    int bloquants;
    int warnings;
    int infos;
    int total;
    List<CompteursParPhaseDto> parPhase;

    @Value
    @Builder
    public static class CompteursParPhaseDto {
        int phase;
        int bloquants;
        int warnings;
        int infos;
        int total;
    }
}
