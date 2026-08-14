package ma.nafura.finance.service.bank;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ImportedStatementLine(
        LocalDate lineDate, String label, String reference, BigDecimal receiptAmount, BigDecimal paymentAmount) {}
