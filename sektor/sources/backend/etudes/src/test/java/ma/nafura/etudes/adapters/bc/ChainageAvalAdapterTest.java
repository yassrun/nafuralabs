package ma.nafura.etudes.adapters.bc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.api.request.ChantierCreateDto;
import ma.nafura.chantiers.api.request.ChantierLotCreateDto;
import ma.nafura.chantiers.api.request.PosteBudgetaireCreateDto;
import ma.nafura.chantiers.domain.budget.OrigineDebourse;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.budget.RubriqueDebourse;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.service.ChantierLotService;
import ma.nafura.chantiers.service.ChantierService;
import ma.nafura.chantiers.service.DebourseNoeudService;
import ma.nafura.chantiers.service.PosteBudgetaireService;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.service.port.bc.ChainageAvalPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * Ce que l'adapter de conversion ne fait plus : démarrer le chantier (AC-8), créer un marché
 * (AC-10), rattraper un poste orphelin en silence (AC-12), écrire un budget par rubrique au
 * niveau chantier (budget-et-marge AC-8).
 *
 * <p>Et ce qu'il fait en plus : poser le déboursé décomposé sur le nœud (budget-et-marge AC-2).
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ChainageAvalAdapterTest {

    private static final UUID LOT_NOEUD = UUID.fromString("11111111-1111-4111-8111-111111111111");
    private static final UUID ARTICLE_NOEUD = UUID.fromString("22222222-2222-4222-8222-222222222222");
    private static final UUID PRIX_DPU = UUID.fromString("33333333-3333-4333-8333-333333333333");
    private static final UUID SOUS_LOT_NOEUD = UUID.fromString("44444444-4444-4444-8444-444444444444");

    @Mock private ChantierService chantierService;
    @Mock private ChantierLotService lotService;
    @Mock private PosteBudgetaireService posteService;
    @Mock private DebourseNoeudService debourseService;

    private ChainageAvalAdapter adapter() {
        return new ChainageAvalAdapter(chantierService, lotService, posteService, debourseService);
    }

    /** AC-8 — le chantier naît en préparation, jamais en cours. */
    @Test
    void chantierNaitEnPreparation() {
        when(chantierService.create(any())).thenReturn(chantier());
        when(lotService.copierLotVendu(any(), any(), any())).thenReturn(lotCree("ch-1-lot-01"));

        adapter().convert(commande(List.of(lotProjete(), articleProjete("L01", debourseDecompose()))));

        ArgumentCaptor<ChantierCreateDto> cap = ArgumentCaptor.forClass(ChantierCreateDto.class);
        verify(chantierService).create(cap.capture());
        assertThat(cap.getValue().getStatus()).isEqualTo(Chantier.STATUS_EN_PREPARATION);
        assertThat(cap.getValue().getStatus()).isNotEqualTo(Chantier.STATUS_EN_COURS);
    }

    /** AC-10 — la conversion ne rend qu'un chantier ; rien du côté contractuel. */
    @Test
    void aucunMarcheNiIdentifiantDeMarcheEnSortie() {
        when(chantierService.create(any())).thenReturn(chantier());
        when(lotService.copierLotVendu(any(), any(), any())).thenReturn(lotCree("ch-1-lot-01"));

        ChainageAvalPort.ConversionResult result =
                adapter().convert(commande(List.of(lotProjete(), articleProjete("L01", debourseDecompose()))));

        assertThat(result.chantierId()).isEqualTo("ch-1");
    }

    /** AC-2, AC-3 — la copie est le seul producteur de vendu, et pose le lien retour. */
    @Test
    void copieLesNoeudsDuDevisEnLignesVendues() {
        when(chantierService.create(any())).thenReturn(chantier());
        when(lotService.copierLotVendu(any(), any(), any())).thenReturn(lotCree("ch-1-lot-01"));

        adapter().convert(commande(List.of(lotProjete(), articleProjete("L01", debourseDecompose()))));

        verify(lotService).copierLotVendu(eq("ch-1"), any(), eq(LOT_NOEUD));
        verify(lotService, never()).create(any(), any());
        ArgumentCaptor<PosteBudgetaireCreateDto> cap =
                ArgumentCaptor.forClass(PosteBudgetaireCreateDto.class);
        verify(posteService).copierPosteVendu(eq("ch-1-lot-01"), cap.capture(), eq(ARTICLE_NOEUD));
        assertThat(cap.getValue().getCode()).isEqualTo("A-01");
    }

    /**
     * budget-et-marge AC-1, AC-2 — le déboursé décomposé descend <b>sur le nœud</b>, avec son
     * origine et la référence du DPU dont il vient.
     */
    @Test
    void poseLeDebourseDecomposeSurLeNoeud() {
        when(chantierService.create(any())).thenReturn(chantier());
        when(lotService.copierLotVendu(any(), any(), any())).thenReturn(lotCree("ch-1-lot-01"));
        when(posteService.copierPosteVendu(any(), any(), any())).thenReturn(posteCree("ch-1-poste-a01"));

        adapter().convert(commande(List.of(lotProjete(), articleProjete("L01", debourseDecompose()))));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<DebourseNoeudService.PartCopiee>> parts =
                ArgumentCaptor.forClass(List.class);
        verify(debourseService)
                .copierDepuisLEtude(
                        eq("ch-1-poste-a01"),
                        eq(OrigineDebourse.DECOMPOSE),
                        eq(false),
                        eq(PRIX_DPU),
                        eq(7L),
                        parts.capture());
        assertThat(parts.getValue())
                .extracting(DebourseNoeudService.PartCopiee::rubrique)
                .containsExactly(
                        RubriqueDebourse.MATIERE,
                        RubriqueDebourse.MAIN_DOEUVRE,
                        RubriqueDebourse.SOUS_TRAITANCE);
        assertThat(parts.getValue())
                .extracting(DebourseNoeudService.PartCopiee::montantHt)
                .containsExactly(
                        new BigDecimal("6000.00"), new BigDecimal("3000.00"), new BigDecimal("1000.00"));
    }

    /**
     * budget-et-marge AC-8 — plus aucun budget par rubrique n'est écrit au niveau chantier. Le
     * seul endroit où un montant atterrit est le nœud.
     */
    @Test
    void nEcritAucunBudgetParRubriqueAuChantier() {
        when(chantierService.create(any())).thenReturn(chantier());
        when(lotService.copierLotVendu(any(), any(), any())).thenReturn(lotCree("ch-1-lot-01"));
        when(posteService.copierPosteVendu(any(), any(), any())).thenReturn(posteCree("ch-1-poste-a01"));

        adapter().convert(commande(List.of(lotProjete(), articleProjete("L01", debourseDecompose()))));

        // Un lot ne porte pas de déboursé propre : rien n'est copié pour lui (AC-1).
        verify(debourseService, never())
                .copierDepuisLEtude(eq("ch-1-lot-01"), any(), anyBoolean(), any(), any(), any());
    }

    /**
     * AC-12 — le lot d'accueil décidé par l'humain n'a pas d'origine : il passe par la saisie,
     * donc il est interne (AC-3), et il accueille bien le poste.
     */
    @Test
    void lotDAccueilSansOrigineEstCreeParSaisie() {
        when(chantierService.create(any())).thenReturn(chantier());
        when(lotService.create(any(), any())).thenReturn(lotCree("ch-1-lot-99"));

        ChainageAvalPort.LotProjection accueil = new ChainageAvalPort.LotProjection(
                null, "L99", "Divers", DpgfNoeud.TYPE_LOT, null, null, null, null, null, 0, null);

        adapter().convert(commande(List.of(accueil, articleProjete("L99", debourseDecompose()))));

        ArgumentCaptor<ChantierLotCreateDto> cap = ArgumentCaptor.forClass(ChantierLotCreateDto.class);
        verify(lotService).create(eq("ch-1"), cap.capture());
        assertThat(cap.getValue().getCode()).isEqualTo("L99");
        // Un interne ne porte pas de prix de vente (AC-4) : rien n'est envoyé.
        assertThat(cap.getValue().getPrixUnitaireHt()).isNull();
        assertThat(cap.getValue().getMontantHt()).isNull();
        verify(lotService, never()).copierLotVendu(any(), any(), any());
        verify(posteService).copierPosteVendu(eq("ch-1-lot-99"), any(), eq(ARTICLE_NOEUD));
    }

    /**
     * budget-et-marge AC-3 — un article sans déboursé projeté ne fait pas échouer la conversion :
     * il reste à zéro, visible, plutôt que de bloquer un devis par ailleurs correct.
     */
    @Test
    void articleSansDebourseNeBloquePasLaConversion() {
        when(chantierService.create(any())).thenReturn(chantier());
        when(lotService.copierLotVendu(any(), any(), any())).thenReturn(lotCree("ch-1-lot-01"));
        when(posteService.copierPosteVendu(any(), any(), any())).thenReturn(posteCree("ch-1-poste-a01"));

        adapter().convert(commande(List.of(lotProjete(), articleProjete("L01", null))));

        verify(posteService).copierPosteVendu(eq("ch-1-lot-01"), any(), eq(ARTICLE_NOEUD));
        verify(debourseService, never()).copierDepuisLEtude(any(), any(), anyBoolean(), any(), any(), any());
    }

    /**
     * AC-12 — plus aucun rattrapage : un article sans lot d'accueil fait échouer la transaction,
     * il ne tombe pas sur « le premier lot trouvé » et ne fabrique pas de « Lot principal ».
     */
    @Test
    void posteSansLotDAccueilEchoueAuLieuDeForgerUnLotPrincipal() {
        when(chantierService.create(any())).thenReturn(chantier());
        when(lotService.copierLotVendu(any(), any(), any())).thenReturn(lotCree("ch-1-lot-01"));

        ChainageAvalPort.ConversionCommand commande =
                commande(List.of(lotProjete(), articleProjete("LOT-INCONNU", debourseDecompose())));

        assertThatThrownBy(() -> adapter().convert(commande))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("poste_sans_lot_daccueil");

        verify(posteService, never()).copierPosteVendu(any(), any(), any());
        verify(lotService, never()).create(any(), any());
    }

    /**
     * SEKTOR-173 — AC-12 étendu à tout nœud.
     *
     * <p>Le sous-lot arrive <b>avant</b> son lot parent dans l'ordre du devis (renumérotation
     * manuelle, ou extraction IA suivant la mise en page du PDF). Sa donnée est parfaitement
     * valide ; c'est l'adapter qui, en un seul passage, ne trouvait pas encore le parent et le
     * créait à la racine <b>en silence</b>.
     */
    @Test
    void sousLotAvantSonParentEstQuandMemeRattache() {
        when(chantierService.create(any())).thenReturn(chantier());
        when(lotService.copierLotVendu(any(), any(), any()))
                .thenReturn(lotCree("ch-1-lot-01"), lotCree("ch-1-souslot-01"));

        // Ordre volontairement inversé : le sous-lot d'abord, son lot ensuite.
        ChainageAvalPort.ConversionCommand commande =
                commande(List.of(sousLotProjete("L01"), lotProjete()));

        adapter().convert(commande);

        ArgumentCaptor<ChantierLotCreateDto> cap = ArgumentCaptor.forClass(ChantierLotCreateDto.class);
        verify(lotService, times(2)).copierLotVendu(any(), cap.capture(), any());

        // Le lot passe en premier malgré l'ordre d'entrée, et le sous-lot le retrouve.
        ChantierLotCreateDto lot = cap.getAllValues().get(0);
        ChantierLotCreateDto sousLot = cap.getAllValues().get(1);
        assertThat(lot.getCode()).isEqualTo("L01");
        assertThat(lot.getParentLotId()).isNull();
        assertThat(sousLot.getCode()).isEqualTo("SL01");
        assertThat(sousLot.getParentLotId()).isEqualTo("ch-1-lot-01");
    }

    /** Le vrai orphelin — un parent qui n'existe nulle part — échoue au lieu de filer à la racine. */
    @Test
    void sousLotSansParentConnuEchoueAuLieuDeRemonterALaRacine() {
        when(chantierService.create(any())).thenReturn(chantier());

        ChainageAvalPort.ConversionCommand commande =
                commande(List.of(sousLotProjete("LOT-INEXISTANT")));

        assertThatThrownBy(() -> adapter().convert(commande))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("lot_sans_parent_daccueil");
    }

    // ── Fixtures ────────────────────────────────────────────────────────────

    private static Chantier chantier() {
        return Chantier.builder().id("ch-1").code("CH-2026-001").label("Résidence").build();
    }

    private static ChantierLot lotCree(String id) {
        return ChantierLot.builder().id(id).chantierId("ch-1").build();
    }

    private static PosteBudgetaire posteCree(String id) {
        return PosteBudgetaire.builder().id(id).lotId("ch-1-lot-01").code("A-01").build();
    }

    private static ChainageAvalPort.DebourseProjection debourseDecompose() {
        return new ChainageAvalPort.DebourseProjection(
                "DECOMPOSE",
                false,
                PRIX_DPU,
                7L,
                List.of(
                        new ChainageAvalPort.PartRubrique("MATIERE", new BigDecimal("6000.00")),
                        new ChainageAvalPort.PartRubrique("MAIN_DOEUVRE", new BigDecimal("3000.00")),
                        new ChainageAvalPort.PartRubrique("SOUS_TRAITANCE", new BigDecimal("1000.00"))));
    }

    private static ChainageAvalPort.LotProjection lotProjete() {
        return new ChainageAvalPort.LotProjection(
                LOT_NOEUD,
                "L01",
                "Gros oeuvre",
                DpgfNoeud.TYPE_LOT,
                null,
                null,
                null,
                null,
                new BigDecimal("15000"),
                0,
                // Un lot vaut la somme de ses enfants : il ne porte pas de déboursé propre.
                null);
    }

    private static ChainageAvalPort.LotProjection sousLotProjete(String parentCode) {
        return new ChainageAvalPort.LotProjection(
                SOUS_LOT_NOEUD,
                "SL01",
                "Fondations",
                DpgfNoeud.TYPE_SOUS_LOT,
                parentCode,
                null,
                null,
                null,
                new BigDecimal("8000"),
                // Ordre plus petit que celui du lot : c'est tout le piège.
                0,
                null);
    }

    private static ChainageAvalPort.LotProjection articleProjete(
            String parentCode, ChainageAvalPort.DebourseProjection debourse) {
        return new ChainageAvalPort.LotProjection(
                ARTICLE_NOEUD,
                "A-01",
                "Beton",
                DpgfNoeud.TYPE_ARTICLE,
                parentCode,
                "m3",
                new BigDecimal("10"),
                new BigDecimal("1500"),
                new BigDecimal("15000"),
                1,
                debourse);
    }

    private static ChainageAvalPort.ConversionCommand commande(
            List<ChainageAvalPort.LotProjection> lots) {
        return new ChainageAvalPort.ConversionCommand(
                UUID.randomUUID(),
                "client-1",
                "MOA",
                "Affaire test",
                "Résidence",
                "CH-2026-001",
                "Casablanca",
                LocalDate.of(2026, 9, 1),
                8,
                "M-42",
                new BigDecimal("15000"),
                new BigDecimal("20"),
                lots);
    }
}
