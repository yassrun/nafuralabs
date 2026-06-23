package ma.nafura.finance.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BankStatementLineDto {

    private UUID id;
    private UUID bankStatementId;
    private LocalDate lineDate;
    private String label;
    private String reference;
    private BigDecimal receiptAmount;
    private BigDecimal paymentAmount;
    private UUID matchedJournalEntryId;
    private UUID matchedJournalEntryLineId;
    private String matchedMouvementRef;
    private String matchStatus;
}
