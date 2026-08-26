package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import com.fasterxml.jackson.databind.ObjectMapper;
import ma.nafura.chantiers.api.dto.ChantierPortefeuilleRowDto;
import ma.nafura.chantiers.api.dto.ChantierSummaryDto;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * SEKTOR-199 — portefeuille décisionnel : lignes aux mêmes faits que le cockpit, filtres et tris
 * serveur (AC-18, AC-19), absence jamais zéro (AC-14).
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ChantierPortefeuilleServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock private ChantierService chantierService;
    @Mock private ChantierSummaryReadService summaryService;
    @Mock private ChantierAffectationService affectationService;
    @Mock private ChantierLotRepository lotRepository;

    private ChantierPortefeuilleService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new ChantierPortefeuilleService(
                chantierService, summaryService, affectationService, lotRepository);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        UserContext.clear();
    }

    private Chantier chantier(String id, String code, String status) {
        return Chantier.builder()
                .id(id).tenantId(TENANT).code(code).label("Chantier " + code)
                .clientName("MOA").status(status).build();
    }

    private ChantierSummaryDto summary(BigDecimal vente, BigDecimal budget) {
        return ChantierSummaryDto.builder()
                .montantVenteActifHt(vente)
                .budgetReviseHt(budget)
                .margeProjeteeHt(vente != null && budget != null ? vente.subtract(budget) : null)
                .margeProjeteePct(vente != null && vente.signum() != 0
                        ? vente.subtract(budget).multiply(BigDecimal.valueOf(100)).divide(vente, 2, java.math.RoundingMode.HALF_UP)
                        : null)
                .build();
    }

    @Test
    void lister_porteLesMemesFaitsQueLeCockpit() {
        UserContext.setUserRole("OWNER");
        Chantier enCours = chantier("ch-1", "CH-001", Chantier.STATUS_EN_COURS);
        enCours.setDateFinPrevue(LocalDate.now().minusDays(3));
        enCours.setAvancementPercent(new BigDecimal("37"));
        when(chantierService.list(null, null, null, null)).thenReturn(List.of(enCours));
        when(summaryService.getSummary("ch-1"))
                .thenReturn(summary(new BigDecimal("737106.00"), new BigDecimal("582600.00")));
        when(affectationService.listByChantier("ch-1")).thenReturn(List.of());

        ChantierPortefeuilleRowDto.Page page = service.lister(
                new ChantierPortefeuilleService.PortefeuilleQuery(
                        null, null, null, null, null, "code", "asc", 0, 20));

        ChantierPortefeuilleRowDto row = page.getItems().getFirst();
        assertThat(row.getStatus()).isEqualTo(Chantier.STATUS_EN_COURS);
        assertThat(row.getMontantVenteActifHt()).isEqualByComparingTo("737106.00");
        assertThat(row.getBudgetReviseHt()).isEqualByComparingTo("582600.00");
        assertThat(row.getMargeProjeteeHt()).isEqualByComparingTo("154506.00");
        assertThat(row.isEnRetard()).isTrue();
        assertThat(row.getJoursRestantsOuRetard()).isEqualTo(3);
        assertThat(row.getProchaineAction().getLibelle())
                .isEqualTo("chantiers.cockpit.action.avancement");
        assertThat(page.getTotal()).isEqualTo(1);
    }

    @Test
    void lister_roleTerrain_neRetourneAucunMontantFinancier() {
        UserContext.setPermissions(java.util.Set.of("chantiers.chantiers.portefeuille.read"));
        Chantier c = chantier("ch-1", "CH-001", Chantier.STATUS_EN_COURS);
        when(chantierService.list(null, null, null, null)).thenReturn(List.of(c));
        when(summaryService.getSummary("ch-1"))
                .thenReturn(summary(new BigDecimal("737106.00"), new BigDecimal("582600.00")));
        when(affectationService.listByChantier("ch-1")).thenReturn(List.of());

        ChantierPortefeuilleRowDto.Page page = service.lister(
                new ChantierPortefeuilleService.PortefeuilleQuery(
                        null, null, null, null, null, null, "code", "asc", 0, 20));

        assertThat(page.isFinanceAutorisee()).isFalse();
        ChantierPortefeuilleRowDto row = page.getItems().getFirst();
        assertThat(row.getMontantVenteActifHt()).isNull();
        assertThat(row.getBudgetReviseHt()).isNull();
        assertThat(row.getMargeProjeteeHt()).isNull();
        assertThat(row.getMargeProjeteePct()).isNull();
        String json;
        try {
            json = new ObjectMapper().writeValueAsString(page);
        } catch (Exception ex) {
            throw new AssertionError(ex);
        }
        assertThat(json).doesNotContain("montantVenteActifHt", "budgetReviseHt",
                "margeProjeteeHt", "margeProjeteePct");
    }

    @Test
    void lister_rechercheCodeNomClient_coteServeur() {
        Chantier a = chantier("ch-a", "CH-A", Chantier.STATUS_EN_COURS);
        Chantier b = chantier("ch-b", "CH-B", Chantier.STATUS_EN_COURS);
        b.setLabel("Hôpital Ibn Sina");
        when(chantierService.list(null, null, null, null)).thenReturn(List.of(a, b));
        when(summaryService.getSummary(org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(ChantierSummaryDto.builder().build());
        when(affectationService.listByChantier(org.mockito.ArgumentMatchers.anyString())).thenReturn(List.of());

        ChantierPortefeuilleRowDto.Page page = service.lister(
                new ChantierPortefeuilleService.PortefeuilleQuery(
                        null, null, null, null, null, "ibn sina", "code", "asc", 0, 20));

        assertThat(page.getItems()).extracting(ChantierPortefeuilleRowDto::getId).containsExactly("ch-b");
    }

    @Test
    void lister_filtreMargeNegative_etStatut() {
        UserContext.setPermissions(java.util.Set.of("chantiers.chantiers.portefeuille.finance.read"));
        Chantier neg = chantier("ch-1", "CH-001", Chantier.STATUS_EN_COURS);
        Chantier pos = chantier("ch-2", "CH-002", Chantier.STATUS_EN_COURS);
        when(chantierService.list(null, null, null, null)).thenReturn(List.of(neg, pos));
        when(summaryService.getSummary("ch-1")).thenReturn(summary(new BigDecimal("500000.00"), new BigDecimal("582600.00")));
        when(summaryService.getSummary("ch-2")).thenReturn(summary(new BigDecimal("737106.00"), new BigDecimal("582600.00")));
        when(affectationService.listByChantier(org.mockito.ArgumentMatchers.anyString())).thenReturn(List.of());

        ChantierPortefeuilleRowDto.Page margeNeg = service.lister(
                new ChantierPortefeuilleService.PortefeuilleQuery(
                        null, null, null, null, true, "code", "asc", 0, 20));
        assertThat(margeNeg.getTotal()).isEqualTo(1);
        assertThat(margeNeg.getItems().getFirst().getMargeProjeteeHt()).isNegative();

        ChantierPortefeuilleRowDto.Page prepa = service.lister(
                new ChantierPortefeuilleService.PortefeuilleQuery(
                        Chantier.STATUS_EN_PREPARATION, null, null, null, null, "code", "asc", 0, 20));
        assertThat(prepa.getTotal()).isZero();
    }

    @Test
    void lister_triParMarge_desc() {
        UserContext.setPermissions(java.util.Set.of("chantiers.chantiers.portefeuille.finance.read"));
        Chantier a = chantier("ch-a", "CH-A", Chantier.STATUS_EN_COURS);
        Chantier b = chantier("ch-b", "CH-B", Chantier.STATUS_EN_COURS);
        when(chantierService.list(null, null, null, null)).thenReturn(List.of(a, b));
        when(summaryService.getSummary("ch-a")).thenReturn(summary(new BigDecimal("100000.00"), new BigDecimal("50000.00")));
        when(summaryService.getSummary("ch-b")).thenReturn(summary(new BigDecimal("100000.00"), new BigDecimal("80000.00")));
        when(affectationService.listByChantier(org.mockito.ArgumentMatchers.anyString())).thenReturn(List.of());

        ChantierPortefeuilleRowDto.Page page = service.lister(
                new ChantierPortefeuilleService.PortefeuilleQuery(
                        null, null, null, null, null, "marge", "desc", 0, 20));

        assertThat(page.getItems()).extracting(ChantierPortefeuilleRowDto::getCode)
                .containsExactly("CH-A", "CH-B");
    }

    @Test
    void lister_triMarge_nullToujoursDernier_enAscEtDesc() {
        UserContext.setPermissions(java.util.Set.of("chantiers.chantiers.portefeuille.finance.read"));
        Chantier a = chantier("ch-a", "CH-A", Chantier.STATUS_EN_COURS);
        Chantier b = chantier("ch-b", "CH-B", Chantier.STATUS_EN_COURS);
        Chantier sansMarge = chantier("ch-z", "CH-Z", Chantier.STATUS_EN_COURS);
        when(chantierService.list(null, null, null, null)).thenReturn(List.of(sansMarge, b, a));
        when(summaryService.getSummary("ch-a")).thenReturn(summary(new BigDecimal("100"), new BigDecimal("10")));
        when(summaryService.getSummary("ch-b")).thenReturn(summary(new BigDecimal("100"), new BigDecimal("80")));
        when(summaryService.getSummary("ch-z")).thenReturn(ChantierSummaryDto.builder().build());
        when(affectationService.listByChantier(org.mockito.ArgumentMatchers.anyString())).thenReturn(List.of());

        for (String sens : List.of("asc", "desc")) {
            ChantierPortefeuilleRowDto.Page page = service.lister(
                    new ChantierPortefeuilleService.PortefeuilleQuery(
                            null, null, null, null, null, "marge", sens, 0, 20));
            assertThat(page.getItems().getLast().getCode()).isEqualTo("CH-Z");
        }
    }

    @Test
    void lister_reutiliseLaDecisionCockpit_etNeProposePasDemarrerAvecBloqueurs() {
        UserContext.setUserRole("OWNER");
        Chantier c = chantier("ch-1", "CH-001", Chantier.STATUS_EN_PREPARATION);
        c.setClientId("client-1");
        c.setDebourseInitialHt(null);
        when(chantierService.list(null, null, null, null)).thenReturn(List.of(c));
        when(summaryService.getSummary("ch-1")).thenReturn(summary(new BigDecimal("100"), new BigDecimal("80")));
        when(affectationService.listByChantier("ch-1")).thenReturn(List.of());
        when(lotRepository.countByTenantIdAndChantierId(TENANT, "ch-1")).thenReturn(0L);

        ChantierPortefeuilleRowDto row = service.lister(
                new ChantierPortefeuilleService.PortefeuilleQuery(
                        null, null, null, null, null, "code", "asc", 0, 20))
                .getItems().getFirst();

        assertThat(row.getProchaineAction()).isNotNull();
        assertThat(row.getProchaineAction().getLibelle()).isEqualTo("chantiers.cockpit.action.preparer");
        assertThat(row.getProchaineAction().getRoute()).isEqualTo("/chantiers/{id}");
    }

    @Test
    void lister_sansDates_niMarge_absencePasZero() {
        Chantier prepa = chantier("ch-1", "CH-001", Chantier.STATUS_EN_PREPARATION);
        when(chantierService.list(null, null, null, null)).thenReturn(List.of(prepa));
        when(summaryService.getSummary("ch-1")).thenReturn(ChantierSummaryDto.builder().build());
        when(affectationService.listByChantier("ch-1")).thenReturn(List.of());

        ChantierPortefeuilleRowDto.Page page = service.lister(
                new ChantierPortefeuilleService.PortefeuilleQuery(
                        null, null, null, null, null, "code", "asc", 0, 20));

        ChantierPortefeuilleRowDto row = page.getItems().getFirst();
        assertThat(row.getJoursRestantsOuRetard()).isNull();
        assertThat(row.isEnRetard()).isFalse();
        assertThat(row.getMontantVenteActifHt()).isNull();
        assertThat(row.getMargeProjeteeHt()).isNull();
        // AC-12 — vente/budget absents → alerte d'intégrité (WARNING), jamais une marge 0 %.
        assertThat(row.getAlerteCode()).isEqualTo("finance_incomplete");
        assertThat(row.getAlerteSeverite()).isEqualTo("WARNING");
    }
}
