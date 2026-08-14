package ma.nafura.achats.api.dto;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScoringOffreLigneDto {

    private UUID id;

    private UUID reponseId;

    private UUID aoLigneId;

    private BigDecimal prixUnitaireHt;

    private BigDecimal totalHt;

    private Integer delaiSpecifique;
}
