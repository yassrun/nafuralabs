package ma.nafura.chantiers.api.request;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class ActiviteRattachementCreateDto {

    private String lotId;

    private String posteId;

    @NotNull
    private BigDecimal quantitePrevue;
}
