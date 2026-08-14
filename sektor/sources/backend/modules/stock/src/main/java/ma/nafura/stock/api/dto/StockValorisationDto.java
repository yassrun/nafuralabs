package ma.nafura.stock.api.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StockValorisationDto {
    private BigDecimal totalValue;
    private BigDecimal depotValue;
    private BigDecimal chantierValue;
    private String costingMethod;
    private String asOfDate;
    private List<StockBalanceViewDto> lines;
}
