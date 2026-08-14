package ma.nafura.achats.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class FactureFournisseurLigneInputDto {

    private Integer ordre;

    @NotBlank
    private String designation;

    private UUID bcLigneId;

    @NotBlank
    private String compteCode;

    private String axeAnalytique;
    private String axeAnalytiqueLibelle;
    private BigDecimal quantite;
    private BigDecimal prixUnitaireHt;

    @NotNull
    private BigDecimal totalHt;

    private BigDecimal tvaTaux;
}
