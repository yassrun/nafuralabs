package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class PrixDpuCreateDto {

    @NotNull
    private UUID ouvrageId;

    private BigDecimal fraisGenerauxPercent;

    private BigDecimal margeBeneficiairePercent;

    private BigDecimal tvaTaux;
}
