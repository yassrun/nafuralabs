package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class ComposantOuvrageInputDto {

    private String type;

    private String articleId;

    @NotBlank
    private String designation;

    @NotBlank
    private String unite;

    @NotNull
    private BigDecimal rendement;

    @NotNull
    private BigDecimal prixUnitaire;

    private BigDecimal total;
}
