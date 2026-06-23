package ma.nafura.finance.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class ReglementCreateDto {

    @NotBlank
    @Size(max = 30)
    private String reglementType;

    @NotNull
    private LocalDate reglementDate;

    @NotBlank
    @Size(max = 30)
    private String paymentModeCode;

    @Size(max = 100)
    private String reference;

    @Size(max = 200)
    private String issuingBank;

    @NotBlank
    @Size(max = 100)
    private String partnerId;

    @Size(max = 255)
    private String partnerName;

    @NotBlank
    @Size(max = 50)
    private String financialAccountId;

    @Size(max = 255)
    private String financialAccountLabel;

    @NotNull
    private BigDecimal totalAmount;

    @Size(max = 20)
    private String status;

    private String notes;

    @Valid
    private List<ReglementImputationDto> imputations;
}
