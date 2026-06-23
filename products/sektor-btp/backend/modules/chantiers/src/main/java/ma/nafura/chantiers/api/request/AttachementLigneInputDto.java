package ma.nafura.chantiers.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class AttachementLigneInputDto {

    @NotBlank
    private String posteCode;

    @NotBlank
    private String designation;

    @NotNull
    private BigDecimal quantiteExecutee;

    @NotBlank
    private String unite;

    private String zone;
}
