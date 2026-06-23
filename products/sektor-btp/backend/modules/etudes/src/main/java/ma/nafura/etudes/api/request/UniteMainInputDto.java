package ma.nafura.etudes.api.request;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class UniteMainInputDto {

    private BigDecimal heures;
    private BigDecimal tauxHoraire;
    private BigDecimal total;
}
