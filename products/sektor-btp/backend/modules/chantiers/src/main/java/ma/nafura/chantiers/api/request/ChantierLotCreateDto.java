package ma.nafura.chantiers.api.request;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class ChantierLotCreateDto {

    private String id;

    @NotBlank
    private String code;

    @NotBlank
    private String designation;

    private String parentLotId;

    private String unite;

    private BigDecimal quantite;

    private BigDecimal prixUnitaireHt;

    private BigDecimal montantHt;

    private BigDecimal avancementPercent;

    private Integer ordre;
}
