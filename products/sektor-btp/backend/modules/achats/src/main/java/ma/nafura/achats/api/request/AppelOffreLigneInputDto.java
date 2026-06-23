package ma.nafura.achats.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class AppelOffreLigneInputDto {

    private UUID id;

    @NotBlank
    private String articleId;

    private String articleCode;

    private String articleName;

    @NotNull
    private BigDecimal quantite;

    private String uomCode;
}
