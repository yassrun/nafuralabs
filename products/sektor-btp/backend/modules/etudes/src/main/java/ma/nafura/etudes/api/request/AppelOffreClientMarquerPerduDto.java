package ma.nafura.etudes.api.request;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class AppelOffreClientMarquerPerduDto {

    private String resultatAttributaire;
    private BigDecimal resultatMontantHt;
    private Integer resultatRangNotre;
    private Integer resultatNbPlis;
    private String notes;
}
