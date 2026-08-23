package ma.nafura.etudes.adapters.bc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.api.request.ChantierCreateDto;
import ma.nafura.chantiers.api.request.ChantierLotCreateDto;
import ma.nafura.chantiers.api.request.PosteBudgetaireCreateDto;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.service.BudgetChantierService;
import ma.nafura.chantiers.service.ChantierLotService;
import ma.nafura.chantiers.service.ChantierService;
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
 * (AC-10), rattraper un poste orphelin en silence (AC-12).
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ChainageAvalAdapterTest {

    private static final UUID LOT_NOEUD = UUID.fromString("11111111-1111-4111-8111-111111111111");
    private static final UUID ARTICLE_NOEUD = UUID.fromString("22222222-2222-4222-8222-222222222222");

    @Mock private ChantierService chantierService;
    @Mock private ChantierLotService lotService;
    @Mock private PosteBudgetaireService posteService;
    @Mock private BudgetChantierService budgetService;

    private ChainageAvalAdapter adapter() {
        return new ChainageAvalAdapter(chantierService, lotService, posteService, budgetService);
    }

    /** AC-8 — le chantier naît en préparation, jamais en cours. */
    @Test
    void chantierNaitEnPreparation() {
        when(chantierService.create(any())).thenReturn(chantier());
        when(lotService.copierLotVendu(any(), any(), any())).thenReturn(lotCree("ch-1-lot-01"));

        adapter().convert(commande(List.of(lotProjete(), articleProjete("L01"))));

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
                adapter().convert(commande(List.of(lotProjete(), articleProjete("L01"))));

        assertThat(result.chantierId()).isEqualTo("ch-1");
        // Le record n'expose plus de marcheId : la seule preuve utile est qu'un budget a bien
        // été posé et que rien d'autre n'a été appelé côté contractuel.
        verify(budgetService).upsert(eq("ch-1"), any());
    }

    /** AC-2, AC-3 — la copie est le seul producteur de vendu, et pose le lien retour. */
    @Test
    void copieLesNoeudsDuDevisEnLignesVendues() {
        when(chantierService.create(any())).thenReturn(chantier());
        when(lotService.copierLotVendu(any(), any(), any())).thenReturn(lotCree("ch-1-lot-01"));

        adapter().convert(commande(List.of(lotProjete(), articleProjete("L01"))));

        verify(lotService).copierLotVendu(eq("ch-1"), any(), eq(LOT_NOEUD));
        verify(lotService, never()).create(any(), any());
        ArgumentCaptor<PosteBudgetaireCreateDto> cap =
                ArgumentCaptor.forClass(PosteBudgetaireCreateDto.class);
        verify(posteService).copierPosteVendu(eq("ch-1-lot-01"), cap.capture(), eq(ARTICLE_NOEUD));
        assertThat(cap.getValue().getCode()).isEqualTo("A-01");
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
                null, "L99", "Divers", DpgfNoeud.TYPE_LOT, null, null, null, null, null, 0);

        adapter().convert(commande(List.of(accueil, articleProjete("L99"))));

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
     * AC-12 — plus aucun rattrapage : un article sans lot d'accueil fait échouer la transaction,
     * il ne tombe pas sur « le premier lot trouvé » et ne fabrique pas de « Lot principal ».
     */
    @Test
    void posteSansLotDAccueilEchoueAuLieuDeForgerUnLotPrincipal() {
        when(chantierService.create(any())).thenReturn(chantier());
        when(lotService.copierLotVendu(any(), any(), any())).thenReturn(lotCree("ch-1-lot-01"));

        ChainageAvalPort.ConversionCommand commande =
                commande(List.of(lotProjete(), articleProjete("LOT-INCONNU")));

        assertThatThrownBy(() -> adapter().convert(commande))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("poste_sans_lot_daccueil");

        verify(posteService, never()).copierPosteVendu(any(), any(), any());
        verify(lotService, never()).create(any(), any());
    }

    // ── Fixtures ────────────────────────────────────────────────────────────

    private static Chantier chantier() {
        return Chantier.builder().id("ch-1").code("CH-2026-001").label("Résidence").build();
    }

    private static ChantierLot lotCree(String id) {
        return ChantierLot.builder().id(id).chantierId("ch-1").build();
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
                0);
    }

    private static ChainageAvalPort.LotProjection articleProjete(String parentCode) {
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
                1);
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
                lots,
                List.of());
    }
}
