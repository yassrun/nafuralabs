package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class DossierPerduDto {

    /** PRIX | DELAI | TECHNIQUE | ADMINISTRATIF | SANS_SUITE */
    @NotBlank
    private String motif;

    private String concurrentRetenu;

    private BigDecimal ecartPrixEstime;
}
