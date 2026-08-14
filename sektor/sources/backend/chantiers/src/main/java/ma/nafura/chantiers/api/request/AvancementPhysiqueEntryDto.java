package ma.nafura.chantiers.api.request;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class AvancementPhysiqueEntryDto {

    private String lotId;

    private String posteId;

    @NotNull
    private BigDecimal quantiteRealisee;

    private String notes;
}
