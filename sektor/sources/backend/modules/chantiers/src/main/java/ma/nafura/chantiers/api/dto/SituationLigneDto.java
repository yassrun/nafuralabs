package ma.nafura.chantiers.api.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SituationLigneDto {

    private String id;
    private String lotId;
    private String lotCode;
    private String posteBudgetaireId;
    private String designation;
    private String unite;
    private BigDecimal quantiteTotale;
    private BigDecimal quantitePrecedente;
    private BigDecimal quantiteCumulee;
    private BigDecimal prixUnitaire;
    private BigDecimal montantHt;
}
