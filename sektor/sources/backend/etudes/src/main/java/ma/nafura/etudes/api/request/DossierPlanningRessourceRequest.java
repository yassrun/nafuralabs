package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class DossierPlanningRessourceRequest {

    @NotBlank
    @Size(max = 20)
    private String type;

    @NotBlank
    @Size(max = 255)
    private String libelle;

    @NotNull
    @Positive
    private BigDecimal quantite;

    @Size(max = 30)
    private String unite;

    @Size(max = 100)
    private String employeId;

    @Size(max = 100)
    private String materielId;

    @Size(max = 1000)
    private String notes;
}
