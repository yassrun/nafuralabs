package ma.nafura.stock.api.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockKpiDto {

    private BigDecimal valorisationStock;
    private double rotation;
    private BigDecimal valoMagasinChantier;
}
