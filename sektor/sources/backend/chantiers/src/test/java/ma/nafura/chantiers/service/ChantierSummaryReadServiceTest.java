package ma.nafura.chantiers.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.BudgetChantierDto;
import ma.nafura.chantiers.api.dto.ChantierSummaryDto;
import ma.nafura.chantiers.domain.chantier.Chantier;
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
        // AC-14 — sans snapshot commercial, la marge héritée est absente, pas un faux zéro.
        assertEquals(null, summary.getBudget().getMargeHt());
        assertEquals(new BigDecimal("42.5"), summary.getAvancementPercent());
        assertEquals(7L, summary.getLotsCount());
        assertEquals(2L, summary.getOpenSituationsCount());
        // AC-17 — création directe : ni vente initiale, ni déboursé, ni marges canoniques.
        assertEquals(null, summary.getMontantVenteInitialHt());
        assertEquals(null, summary.getMontantVenteActifHt());
        assertEquals(null, summary.getDebourseInitialHt());
        assertEquals(null, summary.getMargeInitialeHt());
        assertEquals(null, summary.getMargeInitialePct());
        assertEquals(null, summary.getMargeProjeteeHt());
        assertEquals(null, summary.getMargeProjeteePct());
        assertEquals(null, summary.getSourceVente());
        // AC-2 — le statut affiché est le statut chantier réel.
        assertEquals(Chantier.STATUS_EN_COURS, summary.getStatus());

        verify(chantierService).getById(CHANTIER_ID);
        verify(budgetChantierService).getByChantierId(CHANTIER_ID);
        verify(lotRepository).countByTenantIdAndChantierId(TENANT_ID, CHANTIER_ID);
        verify(situationTravauxService).countOpenByChantier(CHANTIER_ID);
    }

    /**
     * AC-10/AC-12/AC-13 — les valeurs discriminantes du contrat : vente 737106, déboursé 582600,
     * marge initiale 154506, taux 20,96 %. Toutes dérivées du snapshot, jamais recalculées ailleurs.
     */
    @Test
    void getSummary_appliqueLeDictionnaireCanonique() {
        Chantier chantier = Chantier.builder()
                .id(CHANTIER_ID)
                .tenantId(TENANT_ID)
                .code("CH-2026-002")
                .label("École Al Amal")
                .montantVenteInitialHt(new BigDecimal("737106.00"))
                .debourseInitialHt(new BigDecimal("582600.00"))
                .sourceVente("DEVIS")
                .status(Chantier.STATUS_EN_PREPARATION)
                .build();

        BudgetChantierDto budget = BudgetChantierDto.builder()
                .chantierId(CHANTIER_ID)
                .previsionnelHt(new BigDecimal("582600.00"))
                .reviseHt(new BigDecimal("582600.00"))
                .realiseHt(new BigDecimal("0.00"))
                .build();

        when(chantierService.getById(CHANTIER_ID)).thenReturn(chantier);
        when(budgetChantierService.getByChantierId(CHANTIER_ID)).thenReturn(budget);
        when(lotRepository.countByTenantIdAndChantierId(TENANT_ID, CHANTIER_ID)).thenReturn(0L);
        when(situationTravauxService.countOpenByChantier(CHANTIER_ID)).thenReturn(0L);

        ChantierSummaryDto summary = service.getSummary(CHANTIER_ID);

        assertEquals(new BigDecimal("737106.00"), summary.getMontantVenteInitialHt());
        assertEquals(new BigDecimal("737106.00"), summary.getMontantVenteActifHt());
        assertEquals(new BigDecimal("582600.00"), summary.getDebourseInitialHt());
        assertEquals(new BigDecimal("582600.00"), summary.getBudgetReviseHt());
        assertEquals(new BigDecimal("154506.00"), summary.getMargeInitialeHt());
        assertEquals(new BigDecimal("154506.00"), summary.getMargeProjeteeHt());
        assertEquals(new BigDecimal("20.96"), summary.getMargeInitialePct());
        assertEquals("DEVIS", summary.getSourceVente());
        // AC-14 — un chantier EN_PREPARATION n'est jamais présenté EN_COURS.
        assertEquals(Chantier.STATUS_EN_PREPARATION, summary.getStatus());
    }

    /** AC-14 — vente absente : aucune marge en pourcentage (jamais 0 % par défaut). */
    @Test
    void getSummary_venteAbsente_pourcentageIndisponible() {
        Chantier chantier = Chantier.builder()
                .id(CHANTIER_ID)
                .tenantId(TENANT_ID)
                .code("CH-2026-003")
                .label("Sans vente")
                .status(Chantier.STATUS_EN_PREPARATION)
                .build();

        BudgetChantierDto budget = BudgetChantierDto.builder()
                .chantierId(CHANTIER_ID)
                .previsionnelHt(new BigDecimal("100.00"))
                .reviseHt(new BigDecimal("100.00"))
                .realiseHt(new BigDecimal("0.00"))
                .build();

        when(chantierService.getById(CHANTIER_ID)).thenReturn(chantier);
        when(budgetChantierService.getByChantierId(CHANTIER_ID)).thenReturn(budget);
        when(lotRepository.countByTenantIdAndChantierId(TENANT_ID, CHANTIER_ID)).thenReturn(0L);
        when(situationTravauxService.countOpenByChantier(CHANTIER_ID)).thenReturn(0L);

        ChantierSummaryDto summary = service.getSummary(CHANTIER_ID);

        assertEquals(null, summary.getMontantVenteActifHt());
        assertEquals(null, summary.getMargeInitialePct());
        assertEquals(null, summary.getMargeProjeteePct());
    }
}
