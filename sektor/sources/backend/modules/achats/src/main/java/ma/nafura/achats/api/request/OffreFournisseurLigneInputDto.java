package ma.nafura.achats.api.request;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class OffreFournisseurLigneInputDto {

    private UUID id;

    @NotNull
    private UUID aoLigneId;

    @NotNull
    private BigDecimal prixUnitaireHt;

    private BigDecimal totalHt;

    private Integer delaiSpecifique;
}
