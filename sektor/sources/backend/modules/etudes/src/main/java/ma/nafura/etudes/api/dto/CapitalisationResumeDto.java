package ma.nafura.etudes.api.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CapitalisationResumeDto {
    private int totalCandidats;
    private int nouveaux;
    private int collisions;
    private int dejaVerses;
    private boolean dossierValide;
    private List<CapitalisationArticleDto> articles;
}
