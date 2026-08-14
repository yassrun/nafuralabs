package ma.nafura.finance.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class ReglementUpdateDto {

    private LocalDate reglementDate;

    @Size(max = 30)
    private String paymentModeCode;

    @Size(max = 100)
    private String reference;

    @Size(max = 200)
    private String issuingBank;

    @Size(max = 255)
    private String partnerName;

    @Size(max = 50)
    private String financialAccountId;

    @Size(max = 255)
    private String financialAccountLabel;

    private BigDecimal totalAmount;

    private String notes;

    @Valid
    private List<ReglementImputationDto> imputations;
}
