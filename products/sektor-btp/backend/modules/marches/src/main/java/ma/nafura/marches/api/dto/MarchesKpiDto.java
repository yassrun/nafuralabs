package ma.nafura.marches.api.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarchesKpiDto {

    private int nbContratsActifs;
    private BigDecimal cumulSituations;
    private BigDecimal cumulRG;
    private int cautionsExpirant30j;
}
