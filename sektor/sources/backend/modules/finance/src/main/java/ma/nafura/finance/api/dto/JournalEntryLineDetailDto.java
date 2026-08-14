package ma.nafura.finance.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class JournalEntryLineDetailDto {

    private UUID id;
    private Integer lineNumber;
    private String accountCode;
    private String accountLabel;
    private BigDecimal debit;
    private BigDecimal credit;
    private String label;
    private String analyticalAxis;
    private String thirdPartyName;
    private LocalDate dueDate;
}
