package ma.nafura.achats.api.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScoringAODto {

    private UUID aoId;

    private String fournisseurId;

    private String fournisseurName;

    private UUID reponseId;

    @Builder.Default
    private List<ScoringOffreLigneDto> offre = new ArrayList<>();

    private BigDecimal scoreFinal;

    private ScoreDetailDto scoreDetail;

    private String recommandation;

    private String raisonRecommandation;
}
