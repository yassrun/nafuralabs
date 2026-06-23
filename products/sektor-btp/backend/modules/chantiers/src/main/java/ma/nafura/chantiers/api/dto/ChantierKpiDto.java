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
public class ChantierKpiDto {

    private int nbActifs;
    private BigDecimal totalCA;
    private BigDecimal totalMarges;
    private int alertesBudget;
    private int alertesRetard;
}
