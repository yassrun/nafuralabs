package ma.nafura.finance.api.request;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class BankStatementSaveDto {

    @NotNull
    private UUID bankAccountId;

    @NotNull
    private LocalDate periodStart;

    @NotNull
    private LocalDate periodEnd;

    private BigDecimal openingBalanceAccounting;
    private BigDecimal closingBalanceAccounting;
    private BigDecimal closingBalanceStatement;
    private BigDecimal variance;
    private String status;
    private String notes;
    private List<LineMatchInput> lineMatches;
    private List<StatementLineInput> lines;

    @Data
    public static class LineMatchInput {
        private UUID lineId;
        private UUID journalEntryLineId;
        private String mouvementRef;
    }

    @Data
    public static class StatementLineInput {
        private UUID id;
        private LocalDate lineDate;
        private String label;
        private String reference;
        private BigDecimal receiptAmount;
        private BigDecimal paymentAmount;
        private UUID journalEntryLineId;
        private String mouvementRef;
    }
}
