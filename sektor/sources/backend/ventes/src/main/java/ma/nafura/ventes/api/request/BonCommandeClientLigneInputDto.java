package ma.nafura.ventes.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class BonCommandeClientLigneInputDto {

    private Integer ordre;

    @NotBlank
    private String designation;

    private String unite;

    private BigDecimal quantite;

    private BigDecimal prixUnitaireHt;

    @NotNull
    private BigDecimal totalHt;
}
