package ma.nafura.finance.api.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class JournalSummaryDto {

    private String journalCode;
    private String journalName;
    private String journalType;
    private BigDecimal totalDebit;
    private BigDecimal totalCredit;
    private BigDecimal balance;
    private long entryCount;
}
