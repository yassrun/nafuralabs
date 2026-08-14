package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class AvisExecutionCreateDto {

    @NotNull
    private UUID dpgfNoeudId;

    @NotBlank
    private String niveau;

    private String commentaire;

    private BigDecimal ecartPropose;
}
