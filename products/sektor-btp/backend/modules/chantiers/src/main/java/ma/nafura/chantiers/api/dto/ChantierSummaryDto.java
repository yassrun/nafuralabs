package ma.nafura.chantiers.api.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.nafura.chantiers.domain.model.Chantier;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChantierSummaryDto {

    private Chantier chantier;

    private BudgetTotals budget;

    private BigDecimal avancementPercent;

    private long lotsCount;

    private long openSituationsCount;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BudgetTotals {

        private BigDecimal prevuHt;

        private BigDecimal reviseHt;

        private BigDecimal realiseHt;

        private BigDecimal margeHt;
    }
}
