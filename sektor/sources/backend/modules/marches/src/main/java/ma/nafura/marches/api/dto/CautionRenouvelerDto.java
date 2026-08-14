package ma.nafura.marches.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CautionRenouvelerDto {

    private LocalDate dateExpiration;
    private BigDecimal montant;
}
