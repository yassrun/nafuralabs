package ma.nafura.finance.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.finance.api.dto.BalanceResponseDto;
import ma.nafura.finance.domain.model.ChartOfAccount;
import ma.nafura.finance.domain.model.JournalEntry;
import ma.nafura.finance.domain.model.JournalEntryLine;
import ma.nafura.finance.repository.ChartOfAccountRepository;
import ma.nafura.finance.repository.JournalEntryLineRepository;
import ma.nafura.finance.repository.JournalEntryRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BalanceComptableTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");

    @Mock
    private JournalEntryRepository entryRepository;

    @Mock
    private JournalEntryLineRepository lineRepository;

    @Mock
    private ChartOfAccountRepository chartOfAccountRepository;

    @Mock
    private ComptabiliteSeedService seedService;

    @InjectMocks
    private BalanceService balanceService;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_ID);
        TenantContext.setTenantEnabled(true);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void computeAggregatesOpeningAndPeriodMovements() {
        UUID entryId = UUID.randomUUID();
        JournalEntry opening = JournalEntry.builder()
                .id(entryId)
                .tenantId(TENANT_ID)
                .entryNumber("EC-2026-00001")
                .journalId(UUID.randomUUID())
                .journalCode("OD")
                .entryDate(LocalDate.of(2025, 12, 31))
                .fiscalYear(2025)
                .period(12)
                .label("Report")
                .status(JournalEntry.STATUS_POSTE)
                .totalDebit(new BigDecimal("100"))
                .totalCredit(new BigDecimal("100"))
                .build();
        JournalEntry inPeriod = JournalEntry.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT_ID)
                .entryNumber("EC-2026-00002")
                .journalId(UUID.randomUUID())
                .journalCode("AC")
                .entryDate(LocalDate.of(2026, 1, 15))
                .fiscalYear(2026)
                .period(1)
                .label("Achat")
                .status(JournalEntry.STATUS_POSTE)
                .totalDebit(new BigDecimal("50"))
                .totalCredit(new BigDecimal("50"))
                .build();

        when(entryRepository.findByTenantIdAndStatusNotOrderByEntryDateDesc(
                        TENANT_ID, JournalEntry.STATUS_BROUILLON))
                .thenReturn(List.of(inPeriod, opening));
        when(lineRepository.findByTenantIdAndJournalEntryIdOrderByLineNumberAsc(TENANT_ID, opening.getId()))
                .thenReturn(List.of(
                        line(opening.getId(), "6111", "100", "0"),
                        line(opening.getId(), "4411", "0", "100")));
        when(lineRepository.findByTenantIdAndJournalEntryIdOrderByLineNumberAsc(TENANT_ID, inPeriod.getId()))
                .thenReturn(List.of(
                        line(inPeriod.getId(), "6111", "50", "0"),
                        line(inPeriod.getId(), "4411", "0", "50")));
        when(chartOfAccountRepository.findByTenantIdOrderByCodeAsc(TENANT_ID))
                .thenReturn(List.of(
                        account("6111", 6, "CHARGE"),
                        account("4411", 4, "TIERS")));

        BalanceResponseDto balance =
                balanceService.compute(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31), null, null, null);

        assertEquals(2, balance.getLines().size());
        assertEquals(new BigDecimal("100"), balance.getOpeningDebit());
        assertEquals(new BigDecimal("100"), balance.getOpeningCredit());
        assertEquals(new BigDecimal("50"), balance.getPeriodDebit());
        assertEquals(new BigDecimal("50"), balance.getPeriodCredit());
        assertEquals(new BigDecimal("150"), balance.getClosingDebit());
        assertEquals(new BigDecimal("150"), balance.getClosingCredit());
    }

    private static JournalEntryLine line(UUID entryId, String accountCode, String debit, String credit) {
        return JournalEntryLine.builder()
                .tenantId(TENANT_ID)
                .journalEntryId(entryId)
                .lineNumber(1)
                .accountCode(accountCode)
                .debit(new BigDecimal(debit))
                .credit(new BigDecimal(credit))
                .build();
    }

    private static ChartOfAccount account(String code, int accountClass, String accountType) {
        return ChartOfAccount.builder()
                .tenantId(TENANT_ID)
                .code(code)
                .name(code)
                .accountClass(accountClass)
                .accountType(accountType)
                .isCollectif(false)
                .isLettrable(false)
                .isAuxiliaire(false)
                .axeAnalytiqueObligatoire(false)
                .isActive(true)
                .build();
    }
}
