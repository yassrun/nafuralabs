package ma.nafura.achats.api.request;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class CatalogueFournisseurLigneUpdateDto {

    @Size(max = 100)
    private String fournisseurId;

    @Size(max = 100)
    private String articleId;

    @Size(max = 100)
    private String refFournisseur;

    @Size(max = 255)
    private String designation;

    private BigDecimal prixUnitaireHt;

    @Size(max = 30)
    private String uom;

    private Boolean actif;
}
