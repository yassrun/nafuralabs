package ma.nafura.etudes.api.request;

import java.math.BigDecimal;
import java.util.List;
import lombok.Data;

@Data
public class PrixDpuUpdateDto {

    private BigDecimal fraisGenerauxPercent;

    private BigDecimal margeBeneficiairePercent;

    private BigDecimal tvaTaux;

    private List<ComposantDpuInputDto> composants;
}
