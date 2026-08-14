package ma.nafura.finance.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.util.List;
import ma.nafura.finance.api.request.JournalEntryLineDto;
import org.junit.jupiter.api.Test;

class JournalEntryEquilibreTest {

    @Test
    void balancedEntryPassesValidation() {
        List<JournalEntryLineDto> lines = List.of(line("6111", "100.00", "0"), line("4411", "0", "100.00"));
        assertDoesNotThrow(() -> JournalEntryEquilibre.assertBalanced(lines));
        assertEquals(new BigDecimal("100.0000"), JournalEntryEquilibre.sumDebit(lines));
        assertEquals(new BigDecimal("100.0000"), JournalEntryEquilibre.sumCredit(lines));
    }

    @Test
    void unbalancedEntryFailsValidation() {
        List<JournalEntryLineDto> lines = List.of(line("6111", "100.00", "0"), line("4411", "0", "90.00"));
        IllegalArgumentException ex =
                assertThrows(IllegalArgumentException.class, () -> JournalEntryEquilibre.assertBalanced(lines));
        assertEquals("Journal entry is not balanced: debit=100.0000 credit=90.0000", ex.getMessage());
    }

    private static JournalEntryLineDto line(String accountCode, String debit, String credit) {
        JournalEntryLineDto dto = new JournalEntryLineDto();
        dto.setAccountCode(accountCode);
        dto.setDebit(new BigDecimal(debit));
        dto.setCredit(new BigDecimal(credit));
        return dto;
    }
}
