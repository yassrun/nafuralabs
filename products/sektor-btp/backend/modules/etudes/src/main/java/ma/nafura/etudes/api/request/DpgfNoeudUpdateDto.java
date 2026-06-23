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
    private BigDecimal total;
    private Integer ordre;
}
