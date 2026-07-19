package ma.nafura.consultation.api.request;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class PostePricingDto {

    private BigDecimal fraisGenerauxPercent;
    private BigDecimal margePercent;
}
