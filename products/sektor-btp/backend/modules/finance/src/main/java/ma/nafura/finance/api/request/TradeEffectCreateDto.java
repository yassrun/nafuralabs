package ma.nafura.finance.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class TradeEffectCreateDto {
    @NotBlank
    private String type;

    @NotBlank
    private String factureId;

    @NotBlank
    private String clientId;

    private String clientName;

    @NotBlank
    private String banqueDomicile;

    private String banqueTireeId;

    @NotNull
    private BigDecimal montant;

    @NotNull
    private LocalDate dateEcheance;
}
