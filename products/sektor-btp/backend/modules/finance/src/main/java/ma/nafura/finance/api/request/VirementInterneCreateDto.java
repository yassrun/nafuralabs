package ma.nafura.finance.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Data;

@Data
public class VirementInterneCreateDto {
    @NotNull
    private LocalDate date;

    @NotNull
    private UUID compteSourceId;

    private String compteSourceLibelle;

    @NotNull
    private UUID compteDestId;

    private String compteDestLibelle;

    @NotNull
    private BigDecimal montant;

    @NotBlank
    private String motif;

    private String reference;
    private String status;
    private String notes;
}
