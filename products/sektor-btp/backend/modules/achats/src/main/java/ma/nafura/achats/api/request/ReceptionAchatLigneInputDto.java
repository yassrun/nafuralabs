package ma.nafura.achats.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class ReceptionAchatLigneInputDto {

    @NotNull
    private UUID bonCommandeLigneId;

    @NotBlank
    private String articleId;

    @NotNull
    @Positive
    private BigDecimal quantiteRecue;
}
