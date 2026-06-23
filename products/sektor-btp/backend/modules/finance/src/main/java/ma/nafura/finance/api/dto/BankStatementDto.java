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
public class BankStatementDto {

    private UUID id;
    private String statementNumber;
    private UUID bankAccountId;
    private String bankAccountName;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private BigDecimal openingBalanceAccounting;
    private BigDecimal closingBalanceAccounting;
    private BigDecimal closingBalanceStatement;
    private BigDecimal variance;
    private String status;
    private String importedFileName;
    private String notes;
    private OffsetDateTime createdAt;
    private List<BankStatementLineDto> lines;
    private List<String> matchedMouvementRefs;
}
