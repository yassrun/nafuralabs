package ma.nafura.finance.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.finance.api.dto.JournalEntryDetailDto;
import ma.nafura.finance.api.dto.ReglementDetailDto;
import ma.nafura.finance.api.request.JournalEntryCreateDto;
import ma.nafura.finance.domain.model.AccountingJournal;
import ma.nafura.finance.domain.model.Reglement;
import ma.nafura.finance.domain.model.ReglementImputation;
import ma.nafura.finance.repository.AccountingJournalRepository;
import ma.nafura.finance.repository.ReglementImputationRepository;
import ma.nafura.finance.repository.ReglementRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReglementComptabilisationServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");

    @Mock
    private ReglementRepository reglementRepository;

    @Mock
    private ReglementImputationRepository imputationRepository;

    @Mock
    private AccountingJournalRepository journalRepository;

    @Mock
    private JournalEntryService journalEntryService;

    @Mock
    private ComptabiliteSeedService seedService;

    @InjectMocks
    private ReglementService service;

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
    void comptabiliserClientPaymentCreatesBalancedBankAndClientLines() {
        UUID reglementId = UUID.randomUUID();
        UUID journalId = UUID.randomUUID();
        UUID entryId = UUID.randomUUID();

        Reglement reglement = Reglement.builder()
                .id(reglementId)
                .tenantId(TENANT_ID)
                .numero("RG-2026-00001")
                .reglementType(Reglement.TYPE_ENCAISSEMENT_CLIENT)
                .reglementDate(LocalDate.of(2026, 1, 15))
                .paymentModeCode("VIREMENT")
                .partnerId("cli-001")
                .partnerName("OCP Promotion")
                .financialAccountId("cpt-awb-01")
                .totalAmount(new BigDecimal("1000.0000"))
                .status(Reglement.STATUS_BROUILLON)
                .build();

        when(reglementRepository.findByIdAndTenantId(reglementId, TENANT_ID)).thenReturn(Optional.of(reglement));
        when(imputationRepository.findByTenantIdAndReglementIdOrderByFactureDateAsc(TENANT_ID, reglementId))
                .thenReturn(List.of());
        when(journalRepository.findByTenantIdOrderByCodeAsc(TENANT_ID))
                .thenReturn(List.of(AccountingJournal.builder()
                        .id(journalId)
                        .tenantId(TENANT_ID)
                        .code("BQ-AWB")
                        .name("Banque AWB")
                        .journalType("BANQUE")
                        .isActive(true)
                        .build()));

        JournalEntryDetailDto created =
                JournalEntryDetailDto.builder().id(entryId).build();
        JournalEntryDetailDto posted =
                JournalEntryDetailDto.builder().id(entryId).build();
        when(journalEntryService.create(any(JournalEntryCreateDto.class))).thenReturn(created);
        when(journalEntryService.post(entryId)).thenReturn(posted);
        when(reglementRepository.save(any(Reglement.class))).thenAnswer(inv -> inv.getArgument(0));

        ReglementDetailDto result = service.comptabiliser(reglementId);

        ArgumentCaptor<JournalEntryCreateDto> captor = ArgumentCaptor.forClass(JournalEntryCreateDto.class);
        verify(journalEntryService).create(captor.capture());
        verify(journalEntryService).post(entryId);

        JournalEntryCreateDto entry = captor.getValue();
        assertEquals("BQ-AWB", entry.getJournalCode());
        assertEquals(2, entry.getLines().size());
        assertEquals(new BigDecimal("1000.0000"), entry.getLines().get(0).getDebit());
        assertEquals(new BigDecimal("1000.0000"), entry.getLines().get(1).getCredit());

        assertNotNull(result.getJournalEntryId());
        assertEquals(Reglement.STATUS_VALIDE, result.getStatus());
    }
}
