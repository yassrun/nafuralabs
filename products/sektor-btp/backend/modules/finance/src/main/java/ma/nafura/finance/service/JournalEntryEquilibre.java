package ma.nafura.finance.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import ma.nafura.finance.api.request.JournalEntryLineDto;

public final class JournalEntryEquilibre {

    private static final BigDecimal TOLERANCE = new BigDecimal("0.01");

    private JournalEntryEquilibre() {}

    public static BigDecimal sumDebit(List<JournalEntryLineDto> lines) {
        return round(lines.stream()
                .map(JournalEntryLineDto::getDebit)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
    }

    public static BigDecimal sumCredit(List<JournalEntryLineDto> lines) {
        return round(lines.stream()
                .map(JournalEntryLineDto::getCredit)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
    }

    public static void assertBalanced(List<JournalEntryLineDto> lines) {
        BigDecimal debit = sumDebit(lines);
        BigDecimal credit = sumCredit(lines);
        if (debit.subtract(credit).abs().compareTo(TOLERANCE) > 0) {
            throw new IllegalArgumentException(
                    "Journal entry is not balanced: debit=" + debit + " credit=" + credit);
        }
    }

    public static BigDecimal round(BigDecimal value) {
        return value.setScale(4, RoundingMode.HALF_UP);
    }
}
