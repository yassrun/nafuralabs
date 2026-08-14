package ma.nafura.achats.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class BonCommandeAchatLigneInputDto {

    @NotBlank
    private String articleId;

    private String articleCode;

    private String articleName;

    @NotNull
    @Positive
    private BigDecimal quantite;

    private BigDecimal quantiteLivree;

    private BigDecimal quantiteFacturee;

    private String uomCode;

    @NotNull
    @Positive
    private BigDecimal prixUnitaireHt;

    private BigDecimal totalHt;

    private String notes;
}
