package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.BudgetArbreDto;
import ma.nafura.chantiers.domain.budget.CoutReelNoeud;
import ma.nafura.chantiers.domain.budget.DebourseNoeud;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.budget.RubriqueDebourse;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.domain.chantier.NatureLigne;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.CoutReelNoeudRepository;
import ma.nafura.chantiers.repository.DebourseNoeudRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * AC-9, AC-12, AC-13, AC-14 — le rollup, la marge, le déboursé de ce qui est fait et l'écart,
 * sur un chantier qui n'a <b>aucun</b> planning.
 *
 * <p>L'arbre du scénario : un lot vendu portant deux postes vendus, plus un lot interne portant
 * un poste interne — le lot mixte qu'exige AC-12.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BudgetArbreServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String CHANTIER = "ch-1";
    private static final String LOT = "ch-1-lot-01";
    private static final String POSTE_A = "ch-1-lot-01-poste-01";
    private static final String POSTE_B = "ch-1-lot-01-poste-02";
    private static final String POSTE_INTERNE = "ch-1-lot-01-poste-99";

    @Mock private ChantierService chantierService;
    @Mock private ChantierLotRepository lotRepository;
    @Mock private PosteBudgetaireRepository posteRepository;
    @Mock private DebourseNoeudRepository debourseRepository;
    @Mock private CoutReelNoeudRepository coutReelRepository;
    @Mock private AvancementLectureService avancementLectureService;

    private BudgetArbreService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new BudgetArbreService(
                chantierService,
                lotRepository,
                posteRepository,
                debourseRepository,
                coutReelRepository,
                avancementLectureService);

        when(chantierService.getById(CHANTIER)).thenReturn(Chantier.builder()
                .id(CHANTIER)
                .code("CH-2026-001")
                .label("Résidence")
                .clientName("MOA")
                .build());
        when(lotRepository.findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(TENANT, CHANTIER))
                .thenReturn(List.of(lot()));
        when(posteRepository.findByTenantIdAndLotIdOrderByOrdreAscCodeAsc(TENANT, LOT))
                .thenReturn(List.of(posteVendu(POSTE_A, "10000.00", "100"), posteVendu(POSTE_B, "5000.00", "50"), posteInterne()));
        when(coutReelRepository.findByTenantIdAndPosteIdIn(eq(TENANT), any())).thenReturn(List.of());
        when(debourseRepository.findByTenantIdAndPosteIdIn(eq(TENANT), any())).thenReturn(List.of());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    /** AC-9 — un parent vaut la somme de ses enfants, à chaque étage, sans aucune écriture. */
    @Test
    void rollup_lePosteRemonteAuLotPuisAuChantier() {
        when(debourseRepository.findByTenantIdAndPosteIdIn(eq(TENANT), any()))
                .thenReturn(List.of(
                        debourse(POSTE_A, RubriqueDebourse.MATIERE, "6000.00", "6000.00"),
                        debourse(POSTE_A, RubriqueDebourse.MAIN_DOEUVRE, "1000.00", "1000.00"),
                        debourse(POSTE_B, RubriqueDebourse.MATIERE, "3000.00", "3000.00"),
                        debourse(POSTE_INTERNE, RubriqueDebourse.MAIN_DOEUVRE, "2000.00", "2000.00")));

        BudgetArbreDto arbre = service.lireArbre(CHANTIER);

        BudgetArbreDto.NoeudDto lot = arbre.getLots().getFirst();
        assertThat(lot.getTotaux().getDeboursePrevuHt()).isEqualByComparingTo("12000.00");
        assertThat(arbre.getTotaux().getDeboursePrevuHt()).isEqualByComparingTo("12000.00");
        // Le vendu d'un lot est celui de ses postes — jamais celui du lot ET de ses postes.
        assertThat(arbre.getTotaux().getVenduHt()).isEqualByComparingTo("15000.00");

        // AC-8 — la lecture par rubrique est dérivée de l'arbre, pas lue quelque part.
        assertThat(arbre.getRubriques())
                .extracting(BudgetArbreDto.RubriqueTotalDto::getRubrique, BudgetArbreDto.RubriqueTotalDto::getPrevuHt)
                .contains(
                        org.assertj.core.groups.Tuple.tuple("MATIERE", new BigDecimal("9000.00")),
                        org.assertj.core.groups.Tuple.tuple("MAIN_DOEUVRE", new BigDecimal("3000.00")));
    }

    /**
     * AC-12 — la marge est vendu − déboursé, au poste comme au lot. Un nœud interne a un vendu
     * nul : sa marge vaut l'opposé de son déboursé et elle pèse sur celle de son lot.
     */
    @Test
    void marge_lInterneMangeLaMargeDuLot() {
        when(debourseRepository.findByTenantIdAndPosteIdIn(eq(TENANT), any()))
                .thenReturn(List.of(
                        debourse(POSTE_A, RubriqueDebourse.MATIERE, "6000.00", "6000.00"),
                        debourse(POSTE_B, RubriqueDebourse.MATIERE, "3000.00", "3000.00"),
                        debourse(POSTE_INTERNE, RubriqueDebourse.MAIN_DOEUVRE, "2000.00", "2000.00")));

        BudgetArbreDto arbre = service.lireArbre(CHANTIER);
        BudgetArbreDto.NoeudDto lot = arbre.getLots().getFirst();
        BudgetArbreDto.NoeudDto interne = enfant(lot, POSTE_INTERNE);

        // Poste vendu : 10 000 − 6 000 = 4 000, soit 40 %.
        assertThat(enfant(lot, POSTE_A).getTotaux().getMargePrevueHt()).isEqualByComparingTo("4000.00");
        assertThat(enfant(lot, POSTE_A).getTotaux().getMargePrevuePercent()).isEqualByComparingTo("40.00");

        // Nœud interne : vendu nul, marge = −déboursé, et pas de pourcentage qui mentirait.
        assertThat(interne.getTotaux().getVenduHt()).isEqualByComparingTo("0.00");
        assertThat(interne.getTotaux().getMargePrevueHt()).isEqualByComparingTo("-2000.00");
        assertThat(interne.getTotaux().getMargePrevuePercent()).isNull();

        // Le lot : 15 000 vendus − 11 000 déboursés = 4 000. L'installation a mangé les 2 000.
        assertThat(lot.getTotaux().getMargePrevueHt()).isEqualByComparingTo("4000.00");
    }

    /**
     * AC-13 — déboursé prévu de ce qui est fait = avancement × prévu, comparé au réel. Un nœud où
     * le réel dépasse donne un écart négatif, l'autre un écart positif : le signe se prouve.
     */
    @Test
    void ceQuiEstFait_ecartNegatifQuandOnDepassePlusQueLonProduit() {
        when(debourseRepository.findByTenantIdAndPosteIdIn(eq(TENANT), any()))
                .thenReturn(List.of(
                        debourse(POSTE_A, RubriqueDebourse.MATIERE, "6000.00", "6000.00"),
                        debourse(POSTE_B, RubriqueDebourse.MATIERE, "3000.00", "3000.00")));
        when(coutReelRepository.findByTenantIdAndPosteIdIn(eq(TENANT), any()))
                .thenReturn(List.of(
                        coutReel(POSTE_A, RubriqueDebourse.MATIERE, "4000.00"),
                        coutReel(POSTE_B, RubriqueDebourse.MATIERE, "1000.00")));
        when(avancementLectureService.quantiteFaiteCumuleePoste(POSTE_A)).thenReturn(new BigDecimal("40"));
        when(avancementLectureService.quantiteFaiteCumuleePoste(POSTE_B)).thenReturn(new BigDecimal("40"));

        BudgetArbreDto arbre = service.lireArbre(CHANTIER);
        BudgetArbreDto.NoeudDto lot = arbre.getLots().getFirst();

        // A : 40/100 = 40 % de 6 000 = 2 400 fait, 4 000 dépensé → −1 600.
        BudgetArbreDto.TotauxDto a = enfant(lot, POSTE_A).getTotaux();
        assertThat(a.getAvancementPercent()).isEqualByComparingTo("40.00");
        assertThat(a.getDebourseFaitHt()).isEqualByComparingTo("2400.00");
        assertThat(a.getEcartHt()).isEqualByComparingTo("-1600.00");

        // B : 40/50 = 80 % de 3 000 = 2 400 fait, 1 000 dépensé → +1 400.
        BudgetArbreDto.TotauxDto b = enfant(lot, POSTE_B).getTotaux();
        assertThat(b.getAvancementPercent()).isEqualByComparingTo("80.00");
        assertThat(b.getEcartHt()).isEqualByComparingTo("1400.00");

        // Le lot : 4 800 faits − 5 000 dépensés = −200.
        assertThat(lot.getTotaux().getEcartHt()).isEqualByComparingTo("-200.00");
    }

    /**
     * AC-13, AC-14 — sans aucun avancement saisi, ce qui est fait vaut zéro et l'écart reste
     * lisible : rien n'est masqué, rien n'échoue, et aucun planning n'est réclamé.
     */
    @Test
    void sansAvancement_toutResteLisibleEtRienNEchoue() {
        when(debourseRepository.findByTenantIdAndPosteIdIn(eq(TENANT), any()))
                .thenReturn(List.of(debourse(POSTE_A, RubriqueDebourse.MATIERE, "6000.00", "6000.00")));
        when(coutReelRepository.findByTenantIdAndPosteIdIn(eq(TENANT), any()))
                .thenReturn(List.of(coutReel(POSTE_A, RubriqueDebourse.MATIERE, "500.00")));

        BudgetArbreDto.TotauxDto totaux = service.lireArbre(CHANTIER).getTotaux();

        assertThat(totaux.getAvancementPercent()).isEqualByComparingTo("0.00");
        assertThat(totaux.getDebourseFaitHt()).isEqualByComparingTo("0.00");
        assertThat(totaux.getEcartHt()).isEqualByComparingTo("-500.00");
        assertThat(totaux.getDebourseReelHt()).isEqualByComparingTo("500.00");
    }

    /** Un avancement au-delà du prévu ne gonfle pas le budget : il relève de l'avenant. */
    @Test
    void avancement_plafonneACentPourCent() {
        assertThat(BudgetArbreService.avancementEnQuantite(new BigDecimal("10"), new BigDecimal("14")))
                .isEqualByComparingTo("100.00");
        assertThat(BudgetArbreService.avancementEnQuantite(new BigDecimal("10"), new BigDecimal("2.5")))
                .isEqualByComparingTo("25.00");
        assertThat(BudgetArbreService.avancementEnQuantite(BigDecimal.ZERO, new BigDecimal("5")))
                .isEqualByComparingTo("0.00");
        assertThat(BudgetArbreService.avancementEnQuantite(new BigDecimal("10"), null))
                .isEqualByComparingTo("0.00");
    }

    // ── Fixtures ────────────────────────────────────────────────────────────

    private static BudgetArbreDto.NoeudDto enfant(BudgetArbreDto.NoeudDto lot, String id) {
        return lot.getEnfants().stream().filter(e -> id.equals(e.getId())).findFirst().orElseThrow();
    }

    private static ChantierLot lot() {
        return ChantierLot.builder()
                .id(LOT)
                .tenantId(TENANT)
                .chantierId(CHANTIER)
                .code("L01")
                .designation("Gros œuvre")
                .nature(NatureLigne.VENDU)
                .montantHt(new BigDecimal("15000.00"))
                .ordre(0)
                .build();
    }

    private static PosteBudgetaire posteVendu(String id, String montant, String quantite) {
        return PosteBudgetaire.builder()
                .id(id)
                .tenantId(TENANT)
                .lotId(LOT)
                .code(id.substring(id.length() - 2))
                .designation(id)
                .nature(NatureLigne.VENDU)
                .quantite(new BigDecimal(quantite))
                .montantHt(new BigDecimal(montant))
                .debourseNonFiable(false)
                .build();
    }

    private static PosteBudgetaire posteInterne() {
        return PosteBudgetaire.builder()
                .id(POSTE_INTERNE)
                .tenantId(TENANT)
                .lotId(LOT)
                .code("99")
                .designation("Installation de chantier")
                .nature(NatureLigne.INTERNE)
                .debourseNonFiable(false)
                .build();
    }

    private static DebourseNoeud debourse(
            String posteId, RubriqueDebourse rubrique, String prevu, String revise) {
        return DebourseNoeud.builder()
                .id(DebourseNoeud.buildId(posteId, rubrique))
                .tenantId(TENANT)
                .posteId(posteId)
                .rubrique(rubrique)
                .prevuHt(new BigDecimal(prevu))
                .reviseHt(new BigDecimal(revise))
                .build();
    }

    private static CoutReelNoeud coutReel(String posteId, RubriqueDebourse rubrique, String montant) {
        return CoutReelNoeud.builder()
                .id(UUID.randomUUID().toString())
                .tenantId(TENANT)
                .chantierId(CHANTIER)
                .posteId(posteId)
                .rubrique(rubrique)
                .montantHt(new BigDecimal(montant))
                .dateCout(LocalDate.of(2026, 8, 1))
                .imputeParDefaut(false)
                .build();
    }

}
