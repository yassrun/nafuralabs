package ma.nafura.ventes.api.request;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class FactureClientLigneInputDto {

    private Integer ordre;

    @NotBlank
    private String designation;

    private String unite;

    private BigDecimal quantite;

    private BigDecimal prixUnitaireHt;

    private BigDecimal totalHt;
}
