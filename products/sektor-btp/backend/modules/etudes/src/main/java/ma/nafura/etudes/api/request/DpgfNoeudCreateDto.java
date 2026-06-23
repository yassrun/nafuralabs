package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class DpgfNoeudCreateDto {

    private String parentId;

    @NotBlank
    private String type;

    @NotBlank
    private String code;

    @NotBlank
    private String libelle;

    private String articleId;
    private String metreLigneId;
    private BigDecimal quantite;
    private String unite;
    private BigDecimal prixUnitaire;
    private BigDecimal total;
    private Integer ordre;
}
