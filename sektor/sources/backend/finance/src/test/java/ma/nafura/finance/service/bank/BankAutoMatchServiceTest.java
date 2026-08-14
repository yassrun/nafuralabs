package ma.nafura.finance.service.bank;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import ma.nafura.finance.api.dto.BankStatementLineDto;
import ma.nafura.finance.api.dto.MovementCandidateDto;
import ma.nafura.finance.domain.model.BankStatementLine;
import org.junit.jupiter.api.Test;

class BankAutoMatchServiceTest {

    private final BankAutoMatchService service = new BankAutoMatchService();

    @Test
    void suggestMatchesByAmountDateAndDirection() {
        UUID lineId = UUID.randomUUID();
        UUID journalLineId = UUID.randomUUID();
        BankStatementLineDto stmt = BankStatementLineDto.builder()
                .id(lineId)
                .lineDate(LocalDate.of(2026, 1, 10))
                .receiptAmount(new BigDecimal("500.00"))
                .paymentAmount(BigDecimal.ZERO)
                .matchStatus(BankStatementLine.MATCH_UNMATCHED)
                .build();
        MovementCandidateDto mvt = MovementCandidateDto.builder()
                .id("jel:" + journalLineId)
                .date(LocalDate.of(2026, 1, 11))
                .recette(new BigDecimal("500.00"))
                .depense(BigDecimal.ZERO)
                .journalEntryLineId(journalLineId)
                .build();
        List<BankAutoMatchService.MatchSuggestion> suggestions =
                service.suggest(List.of(stmt), List.of(mvt), Set.of());
        assertEquals(1, suggestions.size());
        assertEquals(lineId, suggestions.get(0).lineId());
        assertEquals(journalLineId, suggestions.get(0).journalEntryLineId());
    }

    @Test
    void suggestSkipsWhenAmountDiffers() {
        BankStatementLineDto stmt = BankStatementLineDto.builder()
                .id(UUID.randomUUID())
                .lineDate(LocalDate.of(2026, 1, 10))
                .receiptAmount(new BigDecimal("100.00"))
                .paymentAmount(BigDecimal.ZERO)
                .matchStatus(BankStatementLine.MATCH_UNMATCHED)
                .build();
        MovementCandidateDto mvt = MovementCandidateDto.builder()
                .id("jel:" + UUID.randomUUID())
                .date(LocalDate.of(2026, 1, 10))
                .recette(new BigDecimal("200.00"))
                .depense(BigDecimal.ZERO)
                .journalEntryLineId(UUID.randomUUID())
                .build();
        assertTrue(service.suggest(List.of(stmt), List.of(mvt), Set.of()).isEmpty());
    }
}
