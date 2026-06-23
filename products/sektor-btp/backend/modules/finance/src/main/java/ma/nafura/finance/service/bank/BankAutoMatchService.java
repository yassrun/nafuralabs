package ma.nafura.finance.service.bank;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import ma.nafura.finance.api.dto.BankStatementLineDto;
import ma.nafura.finance.api.dto.MovementCandidateDto;
import ma.nafura.finance.domain.model.BankStatementLine;
import org.springframework.stereotype.Component;

@Component
public class BankAutoMatchService {

    private static final BigDecimal AMOUNT_TOLERANCE = new BigDecimal("0.02");
    private static final long MAX_DAY_DIFF = 3;

    public record MatchSuggestion(UUID lineId, String mouvementRef, UUID journalEntryLineId) {}

    public List<MatchSuggestion> suggest(
            List<BankStatementLineDto> statementLines,
            List<MovementCandidateDto> candidates,
            Set<UUID> alreadyMatchedLineIds) {
        Set<String> usedMvt = new HashSet<>();
        Set<UUID> usedStmt = new HashSet<>(alreadyMatchedLineIds);
        List<MatchSuggestion> suggestions = new ArrayList<>();

        for (BankStatementLineDto line : statementLines) {
            if (usedStmt.contains(line.getId())) {
                continue;
            }
            if (BankStatementLine.MATCH_MATCHED.equals(line.getMatchStatus())) {
                continue;
            }
            BigDecimal lineAmt = amount(line);
            for (MovementCandidateDto mvt : candidates) {
                if (usedMvt.contains(mvt.getId())) {
                    continue;
                }
                if (!sameDirection(line, mvt)) {
                    continue;
                }
                BigDecimal mvtAmt = amount(mvt);
                if (lineAmt.subtract(mvtAmt).abs().compareTo(AMOUNT_TOLERANCE) > 0) {
                    continue;
                }
                if (line.getLineDate() != null
                        && mvt.getDate() != null
                        && Math.abs(ChronoUnit.DAYS.between(line.getLineDate(), mvt.getDate())) > MAX_DAY_DIFF) {
                    continue;
                }
                suggestions.add(new MatchSuggestion(line.getId(), mvt.getId(), mvt.getJournalEntryLineId()));
                usedMvt.add(mvt.getId());
                usedStmt.add(line.getId());
                break;
            }
        }
        return suggestions;
    }

    private static BigDecimal amount(BankStatementLineDto line) {
        if (line.getReceiptAmount() != null && line.getReceiptAmount().signum() > 0) {
            return line.getReceiptAmount();
        }
        return line.getPaymentAmount() != null ? line.getPaymentAmount() : BigDecimal.ZERO;
    }

    private static BigDecimal amount(MovementCandidateDto mvt) {
        if (mvt.getRecette() != null && mvt.getRecette().signum() > 0) {
            return mvt.getRecette();
        }
        return mvt.getDepense() != null ? mvt.getDepense() : BigDecimal.ZERO;
    }

    private static boolean sameDirection(BankStatementLineDto line, MovementCandidateDto mvt) {
        boolean lineIn = line.getReceiptAmount() != null && line.getReceiptAmount().signum() > 0;
        boolean mvtIn = mvt.getRecette() != null && mvt.getRecette().signum() > 0;
        return lineIn == mvtIn;
    }
}
