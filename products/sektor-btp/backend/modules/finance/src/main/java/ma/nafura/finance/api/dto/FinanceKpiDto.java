package ma.nafura.finance.api.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinanceKpiDto {

    private BigDecimal tresorerieCourante;
    private double ratioLiquidite;
    private BigDecimal bfr;
    private BigDecimal dettesFournisseurs;
}
