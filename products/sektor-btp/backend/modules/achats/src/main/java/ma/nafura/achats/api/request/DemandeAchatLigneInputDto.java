package ma.nafura.achats.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class DemandeAchatLigneInputDto {

    @NotBlank
    private String articleId;

    private String articleCode;

    private String articleName;

    @NotNull
    @Positive
    private BigDecimal quantite;

    private String uomCode;

    private BigDecimal prixEstimeHt;

    private BigDecimal totalEstimeHt;

    private String notes;
}
