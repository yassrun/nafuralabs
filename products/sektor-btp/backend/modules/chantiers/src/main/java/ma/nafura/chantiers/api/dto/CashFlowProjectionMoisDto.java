package ma.nafura.chantiers.api.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashFlowProjectionMoisDto {
    private String mois;
    private BigDecimal soldeOuverture;
    private BigDecimal encaissements;
    private BigDecimal decaissements;
    private BigDecimal soldeCloture;
}
