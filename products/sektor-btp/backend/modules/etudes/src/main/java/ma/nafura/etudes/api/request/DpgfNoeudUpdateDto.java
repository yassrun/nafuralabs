package ma.nafura.etudes.api.request;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class DpgfNoeudUpdateDto {

    private String code;
    private String libelle;
    private String articleId;
    private String metreLigneId;
    private BigDecimal quantite;
    private String unite;
    private BigDecimal prixUnitaire;
    private BigDecimal prixFourniBase;
    private BigDecimal fraisGenerauxPercent;
    private BigDecimal margePercent;
    private BigDecimal total;
    private String descriptif;
    private Integer ordre;
    /** FOURNI | DECOMPOSE — articles uniquement. */
    private String mode;
}
