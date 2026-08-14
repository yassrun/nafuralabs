package ma.nafura.etudes.api.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;
import ma.nafura.etudes.domain.model.DemandeCreationArticle;

@Data
@Builder
public class RattrapageResumeDto {
    private int totalLibres;
    private int groupes;
    private String creationArticleMode;
    private List<RattrapageGroupeDto> groupesDetail;
    private List<DemandeCreationArticle> demandesOuvertes;
}
