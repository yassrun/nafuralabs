package ma.nafura.finance.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import ma.nafura.finance.api.dto.LettrageAutoMatchDto;
import ma.nafura.finance.api.dto.LettrageCandidateDto;
import ma.nafura.finance.api.request.LettrageAutoMatchRequestDto;
import ma.nafura.finance.api.request.LettrageCreateDto;
import ma.nafura.finance.domain.model.JournalEntry;
import ma.nafura.finance.domain.model.JournalEntryLine;
import ma.nafura.finance.domain.model.Lettrage;
import ma.nafura.finance.repository.JournalEntryLineRepository;
import ma.nafura.finance.repository.JournalEntryRepository;
import ma.nafura.finance.repository.LettrageLineRepository;
import ma.nafura.finance.repository.LettrageRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LettrageServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");

    @Mock
    private LettrageRepository lettrageRepository;

    @Mock
    private LettrageLineRepository lettrageLineRepository;

    @Mock
    private JournalEntryRepository journalEntryRepository;

    @Mock
    private JournalEntryLineRepository journalEntryLineRepository;

    @InjectMocks
    private LettrageService service;

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
    void codeGeneratorIncrementsAlphabetically() {
        assertEquals("AAA", LettrageCodeGenerator.nextCode(null));
        assertEquals("AAB", LettrageCodeGenerator.nextCode("AAA"));
        assertEquals("AAZ", LettrageCodeGenerator.nextCode("AAY"));
        assertEquals("ABA", LettrageCodeGenerator.nextCode("AAZ"));
    }

    @Test
    void suggestAutoPairFindsMatchingDebitCredit() {
        List<LettrageCandidateDto> rows = List.of(
                candidate("k1", "FAC-1", new BigDecimal("100"), BigDecimal.ZERO),
                candidate("k2", "FAC-1", BigDecimal.ZERO, new BigDecimal("100")));
        List<String> keys = LettrageService.suggestPair(rows);
        assertEquals(List.of("k1", "k2"), keys);
    }

    @Test
    void createRejectsImbalancedWithoutPartial() {
        UUID entryId = UUID.randomUUID();
        UUID lineDebitId = UUID.randomUUID();
        UUID lineCreditId = UUID.randomUUID();
        String keyDebit = entryId + "::" + lineDebitId;
        String keyCredit = entryId + "::" + lineCreditId;

        JournalEntry entry = postedEntry(entryId);
        when(journalEntryRepository.findByIdAndTenantId(entryId, TENANT_ID)).thenReturn(Optional.of(entry));
        when(journalEntryLineRepository.findById(lineDebitId))
                .thenReturn(Optional.of(line(entryId, lineDebitId, new BigDecimal("100"), BigDecimal.ZERO)));
        when(journalEntryLineRepository.findById(lineCreditId))
                .thenReturn(Optional.of(line(entryId, lineCreditId, BigDecimal.ZERO, new BigDecimal("90"))));

        LettrageCreateDto dto = new LettrageCreateDto();
        dto.setLigneKeys(List.of(keyDebit, keyCredit));
        dto.setAccountRadical("3421");
        dto.setAllowPartial(false);

        assertThrows(IllegalArgumentException.class, () -> service.create(dto));
    }

    @Test
    void deleteByCodeRemovesLettrageAndLines() {
        UUID lettrageId = UUID.randomUUID();
        Lettrage entity = Lettrage.builder()
                .id(lettrageId)
                .tenantId(TENANT_ID)
                .code("AAA")
                .accountRadical("3421")
                .status(Lettrage.STATUS_EQUILIBRE)
                .totalDebit(BigDecimal.TEN)
                .totalCredit(BigDecimal.TEN)
                .difference(BigDecimal.ZERO)
                .allowPartial(false)
                .build();
        when(lettrageRepository.findByTenantIdAndCode(TENANT_ID, "AAA")).thenReturn(Optional.of(entity));

        service.deleteByCode("AAA");

        verify(lettrageLineRepository).deleteByTenantIdAndLettrageId(TENANT_ID, lettrageId);
        verify(lettrageRepository).delete(entity);
    }

    @Test
    void autoMatchReturnsObviousPair() {
        UUID entryId = UUID.randomUUID();
        UUID lineDebitId = UUID.randomUUID();
        UUID lineCreditId = UUID.randomUUID();
        JournalEntry entry = postedEntry(entryId);
        entry.setReference("FAC-42");

        when(lettrageLineRepository.findAllLigneKeys(TENANT_ID)).thenReturn(Set.of());
        when(journalEntryRepository.findByTenantIdAndStatusNotOrderByEntryDateDesc(
                        TENANT_ID, JournalEntry.STATUS_BROUILLON))
                .thenReturn(List.of(entry));
        when(journalEntryLineRepository.findByTenantIdAndJournalEntryIdOrderByLineNumberAsc(
                        TENANT_ID, entryId))
                .thenReturn(List.of(
                        line(entryId, lineDebitId, new BigDecimal("50"), BigDecimal.ZERO),
                        line(entryId, lineCreditId, BigDecimal.ZERO, new BigDecimal("50"))));

        LettrageAutoMatchRequestDto request = new LettrageAutoMatchRequestDto();
        request.setAccountRadical("3421");
        LettrageAutoMatchDto result = service.autoMatch(request);

        assertEquals(2, result.getLigneKeys().size());
        assertEquals(
                entryId + "::" + lineDebitId,
                result.getLigneKeys().get(0));
    }

    private static LettrageCandidateDto candidate(String key, String piece, BigDecimal debit, BigDecimal credit) {
        return LettrageCandidateDto.builder()
                .ligneKey(key)
                .piece(piece)
                .debit(debit)
                .credit(credit)
                .date(LocalDate.now())
                .build();
    }

    private static JournalEntry postedEntry(UUID id) {
        return JournalEntry.builder()
                .id(id)
                .tenantId(TENANT_ID)
                .entryNumber("EC-2026-00001")
                .journalId(UUID.randomUUID())
                .journalCode("BQ-AWB")
                .entryDate(LocalDate.now())
                .fiscalYear(2026)
                .period(1)
                .label("Test")
                .status(JournalEntry.STATUS_POSTE)
                .totalDebit(BigDecimal.TEN)
                .totalCredit(BigDecimal.TEN)
                .build();
    }

    private static JournalEntryLine line(UUID entryId, UUID lineId, BigDecimal debit, BigDecimal credit) {
        return JournalEntryLine.builder()
                .id(lineId)
                .tenantId(TENANT_ID)
                .journalEntryId(entryId)
                .lineNumber(1)
                .accountCode("3421")
                .debit(debit)
                .credit(credit)
                .build();
    }
}
