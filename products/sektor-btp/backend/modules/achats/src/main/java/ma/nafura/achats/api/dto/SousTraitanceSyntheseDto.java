package ma.nafura.achats.api.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SousTraitanceSyntheseDto {

    private int count;
    private BigDecimal montantTotalHt;
    private BigDecimal cumulRetenueGarantie;
}
