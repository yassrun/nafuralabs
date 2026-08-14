package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class DevisLigneInputDto {

    private String id;

    private Integer ordre;

    private String parentLigneId;

    @NotBlank
    private String type;

    private String code;

    @NotBlank
    private String designation;

    private String ouvrageId;

    private String unite;

    private BigDecimal quantite;

    private BigDecimal prixUnitaireHt;

    private BigDecimal totalHt;

    private BigDecimal remisePercent;

    private String notes;
}
