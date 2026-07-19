package ma.nafura.etudes.api.request;

import java.math.BigDecimal;
import lombok.Data;

/**
 * Composant d'import — {@code rendement} = quantité PAR UNITÉ d'ouvrage (invariant R1).
 */
@Data
public class ImportComposantDto {

    private String type;
    private String designation;
    private String unite;
    private BigDecimal rendement;
    private Integer ordre;
}
