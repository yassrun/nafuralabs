package ma.nafura.finance.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class ReglementImputationDto {

    @NotBlank
    @Size(max = 100)
    private String factureId;

    @Size(max = 100)
    private String factureNumero;

    private LocalDate factureDate;
    private LocalDate factureDueDate;
    private BigDecimal factureRemaining;

    @NotNull
    private BigDecimal allocatedAmount;
}
