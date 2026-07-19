package ma.nafura.consultation.api.request;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class NoeudUpdateDto {

    private String code;
    private String libelle;
    private String unite;
    private BigDecimal quantite;
    private String descriptif;
    private Integer ordre;
    private String mode;
}
