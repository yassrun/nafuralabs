package ma.nafura.finance.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReglementImputationDetailDto {

    private UUID id;
    private String factureId;
    private String factureNumero;
    private LocalDate factureDate;
    private LocalDate factureDueDate;
    private BigDecimal factureRemaining;
    private BigDecimal allocatedAmount;
}
