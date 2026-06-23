package ma.nafura.ventes.api.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class EncaissementClientCreateDto {

    @NotNull
    private LocalDate dateEncaissement;

    @NotBlank
    private String modePaiement;

    @NotNull
    @DecimalMin(value = "0.0001", inclusive = true)
    private BigDecimal montantTtc;

    private String reference;

    private String banqueId;

    private String banque;

    private String notes;
}
