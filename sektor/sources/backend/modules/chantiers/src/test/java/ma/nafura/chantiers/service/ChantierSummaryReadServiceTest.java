package ma.nafura.chantiers.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.BudgetChantierDto;
import ma.nafura.chantiers.api.dto.ChantierSummaryDto;
import ma.nafura.chantiers.domain.model.Chantier;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ChantierSummaryReadServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final String CHANTIER_ID = "ch-001";

    @Mock
    private ChantierService chantierService;

    @Mock
    private BudgetChantierService budgetChantierService;

    @Mock
    private ChantierLotRepository lotRepository;

    @Mock
    private SituationTravauxService situationTravauxService;

    @InjectMocks
    private ChantierSummaryReadService service;

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
    void getSummaryAggregatesHeaderBudgetAvancementLotsAndOpenSituations() {
        Chantier chantier = Chantier.builder()
                .id(CHANTIER_ID)
                .tenantId(TENANT_ID)
                .code("CH-2026-001")
                .label("Tour Atlas")
                .montantHt(new BigDecimal("1200000"))
                .avancementPercent(new BigDecimal("42.5"))
                .status(Chantier.STATUS_EN_COURS)
                .build();

        BudgetChantierDto budget = BudgetChantierDto.builder()
                .chantierId(CHANTIER_ID)
                .previsionnelHt(new BigDecimal("1200000"))
                .reviseHt(new BigDecimal("1250000"))
                .realiseHt(new BigDecimal("480000"))
                .build();

        when(chantierService.getById(CHANTIER_ID)).thenReturn(chantier);
        when(budgetChantierService.getByChantierId(CHANTIER_ID)).thenReturn(budget);
        when(lotRepository.countByTenantIdAndChantierId(TENANT_ID, CHANTIER_ID)).thenReturn(7L);
        when(situationTravauxService.countOpenByChantier(CHANTIER_ID)).thenReturn(2L);

        ChantierSummaryDto summary = service.getSummary(CHANTIER_ID);

        assertNotNull(summary.getChantier());
        assertEquals(CHANTIER_ID, summary.getChantier().getId());
        assertEquals(new BigDecimal("1200000.00"), summary.getBudget().getPrevuHt());
        assertEquals(new BigDecimal("1250000.00"), summary.getBudget().getReviseHt());
        assertEquals(new BigDecimal("480000.00"), summary.getBudget().getRealiseHt());
        assertEquals(new BigDecimal("770000.00"), summary.getBudget().getMargeHt());
        assertEquals(new BigDecimal("42.5"), summary.getAvancementPercent());
        assertEquals(7L, summary.getLotsCount());
        assertEquals(2L, summary.getOpenSituationsCount());

        verify(chantierService).getById(CHANTIER_ID);
        verify(budgetChantierService).getByChantierId(CHANTIER_ID);
        verify(lotRepository).countByTenantIdAndChantierId(TENANT_ID, CHANTIER_ID);
        verify(situationTravauxService).countOpenByChantier(CHANTIER_ID);
    }
}
