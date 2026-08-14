package ma.nafura.ventes.api.request;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class AvoirClientLigneInputDto {

    private Integer ordre;

    @NotBlank
    private String designation;

    private BigDecimal totalHt;
}
