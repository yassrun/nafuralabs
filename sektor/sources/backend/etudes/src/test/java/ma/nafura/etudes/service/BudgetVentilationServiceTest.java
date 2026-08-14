package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.dpu.ComposantDpu;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.domain.dpu.PrixDpu;
import ma.nafura.etudes.repository.PrixDpuRepository;
import ma.nafura.etudes.service.port.bc.ChainageAvalPort.BudgetRubrique;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import ma.nafura.etudes.service.port.bc.ChainageAvalPort;
@ExtendWith(MockitoExtension.class)
class BudgetVentilationServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock
    private PrixDpuRepository prixDpuRepository;

    private BudgetVentilationService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new BudgetVentilationService(prixDpuRepository);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void forfait_versSousTraitance() {
        DpgfNoeud art = article("F1", "FORFAIT", "100", "10", false);
        List<BudgetRubrique> rubs = service.ventiler(List.of(art));
        assertThat(rubs).hasSize(1);
        assertThat(rubs.getFirst().rubrique()).isEqualTo("SOUS_TRAITANCE");
        assertThat(rubs.getFirst().previsionnelHt()).isEqualByComparingTo("1000.00");
    }

    @Test
    void estimeDeduit_nonVentileNonFiable() {
        DpgfNoeud art = article("E1", "ESTIME", "50", "2", true);
        List<BudgetRubrique> rubs = service.ventiler(List.of(art));
        assertThat(rubs.getFirst().rubrique()).isEqualTo("NON_VENTILE");
        assertThat(rubs.getFirst().nonFiable()).isTrue();
        assertThat(rubs.getFirst().previsionnelHt()).isEqualByComparingTo("100.00");
    }

    @Test
    void decompose_ventileParNature() {
        UUID noeudId = UUID.randomUUID();
        DpgfNoeud art = DpgfNoeud.builder()
                .id(noeudId)
                .type(DpgfNoeud.TYPE_ARTICLE)
                .code("D1")
                .libelle("Cloison")
                .quantite(new BigDecimal("10"))
                .coutUnitaire(new BigDecimal("20"))
                .origineCout("DECOMPOSE")
                .coutDeduit(false)
                .build();
        PrixDpu dpu = PrixDpu.builder()
                .id(UUID.randomUUID())
                .composants(List.of(
                        composant("MATIERE", "10"),
                        composant("MAIN_DOEUVRE", "5"),
                        composant("MATERIEL", "2"),
                        composant("SOUS_TRAITANCE", "3")))
                .build();
        when(prixDpuRepository.findByDpgfNoeudIdAndTenantId(eq(noeudId), eq(TENANT)))
                .thenReturn(Optional.of(dpu));

        List<BudgetRubrique> rubs = service.ventiler(List.of(art));
        assertThat(rubs).extracting(BudgetRubrique::rubrique)
                .containsExactlyInAnyOrder("MATERIAUX", "MO", "MATERIEL", "SOUS_TRAITANCE");
        BigDecimal sum = rubs.stream()
                .map(BudgetRubrique::previsionnelHt)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        // (10+5+2+3)*10 = 200
        assertThat(sum).isEqualByComparingTo("200.00");
    }

    @Test
    void sommeDebourse_egalControle() {
        DpgfNoeud a = article("A", "ESTIME", "40", "5", false);
        assertThat(service.sommeDebourseArticles(List.of(a))).isEqualByComparingTo("200.00");
    }

    private static DpgfNoeud article(
            String code, String origine, String cout, String qte, boolean deduit) {
        return DpgfNoeud.builder()
                .id(UUID.randomUUID())
                .type(DpgfNoeud.TYPE_ARTICLE)
                .code(code)
                .libelle(code)
                .quantite(new BigDecimal(qte))
                .coutUnitaire(new BigDecimal(cout))
                .origineCout(origine)
                .coutDeduit(deduit)
                .build();
    }

    private static ComposantDpu composant(String type, String total) {
        return ComposantDpu.builder()
                .type(type)
                .libelle(type)
                .unite("u")
                .referenceType("LIBRE")
                .rendement(BigDecimal.ONE)
                .prixUnitaire(new BigDecimal(total))
                .total(new BigDecimal(total))
                .build();
    }
}
