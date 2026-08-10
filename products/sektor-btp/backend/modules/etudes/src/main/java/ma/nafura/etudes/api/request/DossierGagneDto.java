package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class DossierGagneDto {

    @NotNull
    private LocalDate dateAttribution;

    private String referenceMarche;

    private BigDecimal montantAttribue;
}
