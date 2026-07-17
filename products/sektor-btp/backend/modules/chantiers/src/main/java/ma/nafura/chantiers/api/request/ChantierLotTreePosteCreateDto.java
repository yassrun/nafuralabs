package ma.nafura.chantiers.api.request;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class ChantierLotTreePosteCreateDto {

    @NotBlank
    private String designation;

    private String unite;

    private BigDecimal quantite;

    private BigDecimal prixUnitaireHt;

    private BigDecimal montantHt;
}
