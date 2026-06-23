package ma.nafura.achats.api.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScoreDetailDto {

    private BigDecimal prix;

    private BigDecimal delai;

    private BigDecimal qualite;

    private BigDecimal historique;

    private BigDecimal art187;
}
