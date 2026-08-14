package ma.nafura.rh.api.request;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class PointageUpdateDto {

    private String mode;
    private String heureArrivee;
    private String heureDepart;
    private BigDecimal heuresNormales;
    private BigDecimal heuresSup;
    private String status;
    private String posteBudgetaireId;
}
