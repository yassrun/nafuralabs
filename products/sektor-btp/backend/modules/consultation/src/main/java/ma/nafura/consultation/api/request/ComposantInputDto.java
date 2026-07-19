package ma.nafura.consultation.api.request;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class ComposantInputDto {

    private String type;

    @NotBlank
    private String designation;

    private String unite;
    private BigDecimal quantiteIndicative;
    private BigDecimal quantite;
    private BigDecimal prixUnitaire;
    private Integer ordre;
}
