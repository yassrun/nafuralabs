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
public class MatchingToleranceDto {

    private BigDecimal pricePct;
    private BigDecimal qtyPct;
}
