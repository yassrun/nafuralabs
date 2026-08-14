package ma.nafura.chantiers.api.request;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class ChantierLotUpdateDto {

    private String code;

    private String designation;

    private String unite;

    private BigDecimal quantite;

    private BigDecimal prixUnitaireHt;

    private BigDecimal montantHt;

    private BigDecimal avancementPercent;

    private Integer ordre;
}
