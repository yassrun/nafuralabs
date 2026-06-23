package ma.nafura.finance.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.finance.api.dto.BalanceLineDto;
import ma.nafura.finance.api.dto.BalanceResponseDto;
import ma.nafura.finance.domain.model.ChartOfAccount;
import ma.nafura.finance.domain.model.JournalEntry;
import ma.nafura.finance.domain.model.JournalEntryLine;
import ma.nafura.finance.repository.ChartOfAccountRepository;
import ma.nafura.finance.repository.JournalEntryLineRepository;
import ma.nafura.finance.repository.JournalEntryRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BalanceService {

    private final JournalEntryRepository entryRepository;
    private final JournalEntryLineRepository lineRepository;
    private final ChartOfAccountRepository chartOfAccountRepository;
    private final ComptabiliteSeedService seedService;

    public BalanceService(
            JournalEntryRepository entryRepository,
            JournalEntryLineRepository lineRepository,
            ChartOfAccountRepository chartOfAccountRepository,
            ComptabiliteSeedService seedService) {
        this.entryRepository = entryRepository;
        this.lineRepository = lineRepository;
        this.chartOfAccountRepository = chartOfAccountRepository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public BalanceResponseDto compute(
            LocalDate from, LocalDate to, Integer accountClass, String accountType, String analyticalAxis) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        LocalDate dateStart = from != null ? from : LocalDate.of(1900, 1, 1);
        LocalDate dateEnd = to != null ? to : LocalDate.of(9999, 12, 31);

        Map<String, Agg> aggregates = new HashMap<>();
        List<JournalEntry> entries = entryRepository.findByTenantIdAndStatusNotOrderByEntryDateDesc(
                tenantId, JournalEntry.STATUS_BROUILLON);

        for (JournalEntry entry : entries) {
            List<JournalEntryLine> lines =
                    lineRepository.findByTenantIdAndJournalEntryIdOrderByLineNumberAsc(tenantId, entry.getId());
            for (JournalEntryLine line : lines) {
                if (analyticalAxis != null
                        && !analyticalAxis.isBlank()
                        && !analyticalAxis.equals(line.getAnalyticalAxis())) {
                    continue;
                }
                boolean isOpening = entry.getEntryDate().isBefore(dateStart);
                boolean inPeriod = !entry.getEntryDate().isBefore(dateStart) && !entry.getEntryDate().isAfter(dateEnd);
                if (!isOpening && !inPeriod) {
                    continue;
                }
                Agg agg = aggregates.computeIfAbsent(line.getAccountCode(), k -> new Agg());
                if (isOpening) {
                    agg.openingDebit = agg.openingDebit.add(line.getDebit());
                    agg.openingCredit = agg.openingCredit.add(line.getCredit());
                } else {
                    agg.periodDebit = agg.periodDebit.add(line.getDebit());
                    agg.periodCredit = agg.periodCredit.add(line.getCredit());
                }
            }
        }

        Map<String, ChartOfAccount> accountsByCode = new HashMap<>();
        for (ChartOfAccount account : chartOfAccountRepository.findByTenantIdOrderByCodeAsc(tenantId)) {
            accountsByCode.put(account.getCode(), account);
        }

        List<BalanceLineDto> lines = new ArrayList<>();
        BigDecimal openingDebit = BigDecimal.ZERO;
        BigDecimal openingCredit = BigDecimal.ZERO;
        BigDecimal periodDebit = BigDecimal.ZERO;
        BigDecimal periodCredit = BigDecimal.ZERO;

        for (Map.Entry<String, Agg> row : aggregates.entrySet()) {
            ChartOfAccount account = accountsByCode.get(row.getKey());
            if (account == null) {
                continue;
            }
            if (accountClass != null && !accountClass.equals(account.getAccountClass())) {
                continue;
            }
            if (accountType != null
                    && !accountType.isBlank()
                    && !accountType.equalsIgnoreCase(account.getAccountType())) {
                continue;
            }
            Agg agg = row.getValue();
            BigDecimal closingDebit = agg.openingDebit.add(agg.periodDebit);
            BigDecimal closingCredit = agg.openingCredit.add(agg.periodCredit);
            lines.add(BalanceLineDto.builder()
                    .accountCode(account.getCode())
                    .accountName(account.getName())
                    .accountClass(account.getAccountClass())
                    .accountType(account.getAccountType())
                    .openingDebit(agg.openingDebit)
                    .openingCredit(agg.openingCredit)
                    .periodDebit(agg.periodDebit)
                    .periodCredit(agg.periodCredit)
                    .closingDebit(closingDebit)
                    .closingCredit(closingCredit)
                    .build());
            openingDebit = openingDebit.add(agg.openingDebit);
            openingCredit = openingCredit.add(agg.openingCredit);
            periodDebit = periodDebit.add(agg.periodDebit);
            periodCredit = periodCredit.add(agg.periodCredit);
        }

        lines.sort(Comparator.comparing(BalanceLineDto::getAccountCode));
        return BalanceResponseDto.builder()
                .lines(lines)
                .openingDebit(openingDebit)
                .openingCredit(openingCredit)
                .periodDebit(periodDebit)
                .periodCredit(periodCredit)
                .closingDebit(openingDebit.add(periodDebit))
                .closingCredit(openingCredit.add(periodCredit))
                .build();
    }

    private static class Agg {
        BigDecimal openingDebit = BigDecimal.ZERO;
        BigDecimal openingCredit = BigDecimal.ZERO;
        BigDecimal periodDebit = BigDecimal.ZERO;
        BigDecimal periodCredit = BigDecimal.ZERO;
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
