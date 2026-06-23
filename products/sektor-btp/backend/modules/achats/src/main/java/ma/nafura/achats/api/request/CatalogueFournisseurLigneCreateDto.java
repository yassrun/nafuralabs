package ma.nafura.achats.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class CatalogueFournisseurLigneCreateDto {

    @NotBlank
    @Size(max = 100)
    private String fournisseurId;

    @NotBlank
    @Size(max = 100)
    private String articleId;

    @Size(max = 100)
    private String refFournisseur;

    @NotBlank
    @Size(max = 255)
    private String designation;

    @NotNull
    private BigDecimal prixUnitaireHt;

    @Size(max = 30)
    private String uom;

    private Boolean actif;
}
