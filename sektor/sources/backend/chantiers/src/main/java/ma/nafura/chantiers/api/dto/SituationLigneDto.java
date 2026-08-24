package ma.nafura.chantiers.api.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SituationLigneDto {

    private String id;
    private String noeudId;
    private String code;
    private String designation;
    private String unite;
    private BigDecimal quantiteTotale;
    private BigDecimal quantitePeriode;
    private BigDecimal quantitePrecedente;
    private BigDecimal quantiteCumulee;
    private BigDecimal prixUnitaire;
    private BigDecimal montantHt;
}
