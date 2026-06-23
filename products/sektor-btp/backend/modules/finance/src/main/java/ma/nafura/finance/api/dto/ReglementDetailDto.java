package ma.nafura.finance.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReglementDetailDto {

    private UUID id;
    private String numero;
    private String reglementType;
    private LocalDate reglementDate;
    private String paymentModeCode;
    private String reference;
    private String issuingBank;
    private String partnerId;
    private String partnerName;
    private String financialAccountId;
    private String financialAccountLabel;
    private BigDecimal totalAmount;
    private String status;
    private UUID journalEntryId;
    private String notes;
    private OffsetDateTime createdAt;
    private List<ReglementImputationDetailDto> imputations;
}
