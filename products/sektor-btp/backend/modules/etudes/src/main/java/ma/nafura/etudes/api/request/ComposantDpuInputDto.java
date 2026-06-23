package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class ComposantDpuInputDto {

    private UUID id;

    @NotBlank
    private String type;

    @NotBlank
    private String articleOuPosteId;

    @NotNull
    private BigDecimal quantite;

    @NotBlank
    private String unite;

    @NotNull
    private BigDecimal prixUnitaire;

    private BigDecimal total;
}
