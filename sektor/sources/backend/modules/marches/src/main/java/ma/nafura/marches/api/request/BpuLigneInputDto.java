package ma.nafura.marches.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class BpuLigneInputDto {

    private String id;

    @NotBlank
    private String posteCode;

    @NotBlank
    private String designation;

    @NotBlank
    private String unite;

    @NotNull
    private BigDecimal quantite;

    @NotNull
    private BigDecimal prixUnitaireHt;

    private Integer ordre;
}
