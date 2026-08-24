package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.domain.dpu.ComposantDpu;
import ma.nafura.etudes.domain.dpu.PrixDpu;
import ma.nafura.etudes.repository.PrixDpuRepository;
import ma.nafura.etudes.service.port.bc.ChainageAvalPort.DebourseProjection;
import ma.nafura.etudes.service.port.bc.ChainageAvalPort.PartRubrique;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** AC-2, AC-3, AC-4 — ce que la copie du DPU pose sur un nœud, et ce qu'elle ne perd pas. */
@ExtendWith(MockitoExtension.class)
class DebourseDuNoeudServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock private PrixDpuRepository prixDpuRepository;

    private DebourseDuNoeudService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new DebourseDuNoeudService(prixDpuRepository);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    /** AC-1 — un lot vaut la somme de ses enfants : il ne porte pas de déboursé propre. */
    @Test
    void unLotNaPasDeDebourseAlui() {
        DpgfNoeud lot = DpgfNoeud.builder()
                .id(UUID.randomUUID())
                .type(DpgfNoeud.TYPE_LOT)
                .code("L01")
                .libelle("Gros œuvre")
                .build();
        assertThat(service.debourseDuNoeud(lot)).isNull();
    }

    /** AC-3 — un forfait n'a pas de sous-détail : tout son déboursé est de la sous-traitance. */
    @Test
    void forfait_toutEnSousTraitance() {
        DebourseProjection d = service.debourseDuNoeud(article("F1", "FORFAIT", "100", "10", false));

        assertThat(d.origine()).isEqualTo("FORFAIT");
        assertThat(d.parts()).singleElement().satisfies(p -> {
            assertThat(p.rubrique()).isEqualTo("SOUS_TRAITANCE");
            assertThat(p.montantHt()).isEqualByComparingTo("1000.00");
        });
    }

    /** AC-3 — un estimé pose son déboursé en non ventilé, et un coût déduit est signalé. */
    @Test
    void estimeDeduit_nonVentileEtNonFiable() {
        DebourseProjection d = service.debourseDuNoeud(article("E1", "ESTIME", "50", "2", true));

        assertThat(d.origine()).isEqualTo("ESTIME");
        assertThat(d.nonFiable()).isTrue();
        assertThat(d.parts()).singleElement().satisfies(p -> {
            assertThat(p.rubrique()).isEqualTo("NON_VENTILE");
            assertThat(p.montantHt()).isEqualByComparingTo("100.00");
        });
    }

    /** AC-3 — décomposé sur le papier mais sans composants : non ventilé, jamais zéro. */
    @Test
    void decomposeSansComposants_nonVentile() {
        DpgfNoeud art = article("D0", "DECOMPOSE", "40", "5", false);
        when(prixDpuRepository.findByDpgfNoeudIdAndTenantId(eq(art.getId()), eq(TENANT)))
                .thenReturn(Optional.empty());

        DebourseProjection d = service.debourseDuNoeud(art);

        assertThat(d.origine()).isEqualTo("DECOMPOSE");
        assertThat(d.parts()).singleElement().satisfies(p -> {
            assertThat(p.rubrique()).isEqualTo("NON_VENTILE");
            assertThat(p.montantHt()).isEqualByComparingTo("200.00");
        });
    }

    /** AC-2 — chaque composant contribue à la rubrique de son type, × la quantité du poste. */
    @Test
    void decompose_chaqueComposantDansSaRubrique() {
        DpgfNoeud art = article("D1", "DECOMPOSE", "20", "10", false);
        PrixDpu dpu = dpu(
                null,
                composantParUnite("MATIERE", "10"),
                composantParUnite("MAIN_DOEUVRE", "5"),
                composantParUnite("MATERIEL", "2"),
                composantParUnite("SOUS_TRAITANCE", "3"));
        when(prixDpuRepository.findByDpgfNoeudIdAndTenantId(eq(art.getId()), eq(TENANT)))
                .thenReturn(Optional.of(dpu));

        DebourseProjection d = service.debourseDuNoeud(art);

        assertThat(d.parts())
                .extracting(PartRubrique::rubrique)
                .containsExactly("MATIERE", "MAIN_DOEUVRE", "MATERIEL", "SOUS_TRAITANCE");
        assertThat(d.parts())
                .extracting(PartRubrique::montantHt)
                .containsExactly(
                        new BigDecimal("100.00"),
                        new BigDecimal("50.00"),
                        new BigDecimal("20.00"),
                        new BigDecimal("30.00"));
        assertThat(somme(d)).isEqualByComparingTo("200.00");
        assertThat(d.prixDpuId()).isEqualTo(dpu.getId());
        assertThat(d.prixDpuVersion()).isEqualTo(3L);
    }

    /**
     * AC-2 — base mixte : un composant chiffré à la journée est ramené à l'unité par le rendement
     * journalier de l'ouvrage. Exemple réel « Déblais en masse » : tractopelle 1500/j et pannes
     * 200/j pour 100 m³/jour, plus gasoil 10 DH déjà au m³ → (1500 + 200)/100 + 10 = 27 DH/m³.
     */
    @Test
    void decompose_composantJournalierRameneALUnite() {
        DpgfNoeud art = article("D2", "DECOMPOSE", "27", "100", false);
        PrixDpu dpu = dpu(
                new BigDecimal("100"),
                composantJournalier("MATERIEL", "1500"),
                composantJournalier("MATERIEL", "200"),
                composantParUnite("MATIERE", "10"));
        when(prixDpuRepository.findByDpgfNoeudIdAndTenantId(eq(art.getId()), eq(TENANT)))
                .thenReturn(Optional.of(dpu));

        DebourseProjection d = service.debourseDuNoeud(art);

        // 1700/100 = 17 DH/m³ de matériel, 10 DH/m³ de matière, sur 100 m³.
        assertThat(d.parts())
                .extracting(PartRubrique::rubrique, PartRubrique::montantHt)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("MATIERE", new BigDecimal("1000.00")),
                        org.assertj.core.groups.Tuple.tuple("MATERIEL", new BigDecimal("1700.00")));
        assertThat(somme(d)).isEqualByComparingTo("2700.00");
    }

    /**
     * AC-2 — sans rendement journalier, un composant journalier ne peut pas être ramené à
     * l'unité : le compter tel quel gonflerait le déboursé. Il est ignoré, et l'écart avec le
     * coût du devis retombe en non ventilé plutôt que de disparaître (AC-4).
     */
    @Test
    void decompose_journalierSansRendement_tombeEnNonVentile() {
        DpgfNoeud art = article("D3", "DECOMPOSE", "10", "10", false);
        PrixDpu dpu = dpu(null, composantJournalier("MAIN_DOEUVRE", "750"), composantParUnite("MATIERE", "4"));
        when(prixDpuRepository.findByDpgfNoeudIdAndTenantId(eq(art.getId()), eq(TENANT)))
                .thenReturn(Optional.of(dpu));

        DebourseProjection d = service.debourseDuNoeud(art);

        assertThat(d.parts())
                .extracting(PartRubrique::rubrique, PartRubrique::montantHt)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("MATIERE", new BigDecimal("40.00")),
                        org.assertj.core.groups.Tuple.tuple("NON_VENTILE", new BigDecimal("60.00")));
        assertThat(somme(d)).isEqualByComparingTo("100.00");
    }

    /**
     * AC-4 — la copie ne perd rien. Un déboursé sec arrondi au centime ne se répartit pas
     * exactement ; le résidu d'arrondi est absorbé, pas perdu, et la somme des rubriques vaut
     * exactement coût unitaire × quantité.
     */
    @Test
    void decompose_residuDArrondiAbsorbe_sommeExacte() {
        // Trois composants qui font 10,00 pile à l'unité, sur une demi-unité : chaque part
        // s'arrondit à 1,67 et leur somme vaut 5,01 là où le devis dit 5,00.
        DpgfNoeud art = article("D4", "DECOMPOSE", "10.00", "0.5", false);
        PrixDpu dpu = dpu(
                null,
                composantParUnite("MATIERE", "3.333"),
                composantParUnite("MAIN_DOEUVRE", "3.333"),
                composantParUnite("MATERIEL", "3.334"));
        when(prixDpuRepository.findByDpgfNoeudIdAndTenantId(eq(art.getId()), eq(TENANT)))
                .thenReturn(Optional.of(dpu));

        DebourseProjection d = service.debourseDuNoeud(art);

        assertThat(somme(d)).isEqualByComparingTo("5.00");
        // Le résidu (0,01) est resté dans les quatre rubriques : rien en non ventilé.
        assertThat(d.parts()).extracting(PartRubrique::rubrique).doesNotContain("NON_VENTILE");
    }

    /** AC-4 — le contrôle croisé de la conversion : Σ (coût unitaire × quantité). */
    @Test
    void sommeDebourseArticles_ignoreLesLots() {
        DpgfNoeud lot = DpgfNoeud.builder()
                .id(UUID.randomUUID())
                .type(DpgfNoeud.TYPE_LOT)
                .code("L01")
                .libelle("L01")
                .quantite(BigDecimal.ONE)
                .coutUnitaire(new BigDecimal("999999"))
                .build();
        DpgfNoeud a = article("A", "ESTIME", "40", "5", false);
        DpgfNoeud b = article("B", "FORFAIT", "12.5", "4", false);

        assertThat(service.sommeDebourseArticles(List.of(lot, a, b))).isEqualByComparingTo("250.00");
    }

    // ── Fixtures ────────────────────────────────────────────────────────────

    private static BigDecimal somme(DebourseProjection d) {
        return d.parts().stream().map(PartRubrique::montantHt).reduce(BigDecimal.ZERO, BigDecimal::add);
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

    private static PrixDpu dpu(BigDecimal rendementJournalier, ComposantDpu... composants) {
        return PrixDpu.builder()
                .id(UUID.randomUUID())
                .version(3L)
                .rendementJournalier(rendementJournalier)
                .composants(List.of(composants))
                .build();
    }

    private static ComposantDpu composantParUnite(String type, String total) {
        return composant(type, total, ComposantDpu.BASE_PAR_UNITE);
    }

    private static ComposantDpu composantJournalier(String type, String total) {
        return composant(type, total, ComposantDpu.BASE_PAR_JOUR);
    }

    private static ComposantDpu composant(String type, String total, String base) {
        return ComposantDpu.builder()
                .type(type)
                .libelle(type)
                .unite("u")
                .referenceType("LIBRE")
                .baseRendement(base)
                .rendement(BigDecimal.ONE)
                .prixUnitaire(new BigDecimal(total))
                .total(new BigDecimal(total))
                .build();
    }
}
