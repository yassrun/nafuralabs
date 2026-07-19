package ma.nafura.etudes.service.gate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.model.ComposantDpu;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.domain.model.PrixDpu;
import ma.nafura.etudes.repository.PrixDpuRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GatesEtudeTest {

    @Mock private PrixDpuRepository prixDpuRepository;

    private static DpgfNoeud article(String code, String unite, String qte, String mode) {
        return DpgfNoeud.builder()
                .id(UUID.randomUUID())
                .type(DpgfNoeud.TYPE_ARTICLE)
                .code(code)
                .libelle("Article " + code)
                .unite(unite)
                .quantite(qte == null ? null : new BigDecimal(qte))
                .mode(mode)
                .ordre(0)
                .build();
    }

    // ── Étape 1 — pièces du marché ───────────────────────────────────────────

    @Test
    void aucune_piece_deposee_est_bloquant() {
        ResultatGate r = new GatesEtude.GateDocuments().evaluer(new ContexteGate(List.of(), 0));

        assertThat(r.passe()).isFalse();
        assertThat(r.bloquant()).isTrue();
        assertThat(r.problemes()).singleElement()
                .extracting(ResultatGate.ProblemeGate::message)
                .isEqualTo("etudes.gate.documents.aucune_piece");
    }

    @Test
    void une_piece_suffit_a_franchir_l_etape_des_documents() {
        // Sans article : c'est précisément le cas qui rendait le parcours sans issue quand
        // l'étape 1 réclamait un bordereau que seule l'étape 2 peut produire.
        ResultatGate r = new GatesEtude.GateDocuments().evaluer(new ContexteGate(List.of(), 1));

        assertThat(r.passe()).isTrue();
    }

    // ── Étape 2 — bordereau ──────────────────────────────────────────────────

    @Test
    void bordereau_vide_est_bloquant() {
        ResultatGate r = new GatesEtude.GateBordereau().evaluer(ContexteGate.deArticles(List.of()));
        assertThat(r.passe()).isFalse();
        assertThat(r.bloquant()).isTrue();
        assertThat(r.problemes()).singleElement()
                .extracting(ResultatGate.ProblemeGate::message)
                .isEqualTo("etudes.gate.bordereau.aucun_article");
    }

    @Test
    void bordereau_signale_chaque_article_fautif_pas_seulement_le_premier() {
        List<DpgfNoeud> articles = List.of(
                article("1-1", "m3", "70", DpgfNoeud.MODE_FOURNI),
                article("1-2", null, "10", DpgfNoeud.MODE_FOURNI),
                article("1-3", "m2", "0", DpgfNoeud.MODE_FOURNI));

        ResultatGate r = new GatesEtude.GateBordereau().evaluer(ContexteGate.deArticles(articles));

        // C'est tout l'intérêt de retourner une liste : l'UI affiche des liens cliquables
        // au lieu d'un bouton grisé sans explication.
        assertThat(r.problemes()).hasSize(2);
        assertThat(r.problemes()).extracting(ResultatGate.ProblemeGate::codeArticle)
                .containsExactly("1-2", "1-3");
    }

    // ── Étape 3 ──────────────────────────────────────────────────────────────

    @Test
    void article_fourni_ne_reclame_pas_de_decomposition() {
        List<DpgfNoeud> articles = List.of(article("1-1", "m3", "70", DpgfNoeud.MODE_FOURNI));
        ResultatGate r = new GatesEtude.GateDecomposition(prixDpuRepository).evaluer(ContexteGate.deArticles(articles));
        assertThat(r.passe()).isTrue();
    }

    @Test
    void article_decompose_sans_dpu_est_bloquant() {
        List<DpgfNoeud> articles = List.of(article("1-1", "m3", "70", DpgfNoeud.MODE_DECOMPOSE));
        ResultatGate r = new GatesEtude.GateDecomposition(prixDpuRepository).evaluer(ContexteGate.deArticles(articles));
        assertThat(r.problemes()).singleElement()
                .extracting(ResultatGate.ProblemeGate::message)
                .isEqualTo("etudes.gate.decomposition.absente");
    }

    @Test
    void decomposition_a_rendements_tous_nuls_est_bloquante() {
        // Un composant à rendement 0 ne contribue rien au déboursé : la décomposition
        // existe formellement mais ne chiffre rien.
        UUID dpuId = UUID.randomUUID();
        DpgfNoeud a = article("1-1", "m3", "70", DpgfNoeud.MODE_DECOMPOSE);
        a.setPrixDpuId(dpuId);
        PrixDpu dpu = PrixDpu.builder().id(dpuId).build();
        dpu.setComposants(List.of(
                ComposantDpu.builder().rendement(BigDecimal.ZERO).build()));
        when(prixDpuRepository.findById(dpuId)).thenReturn(Optional.of(dpu));

        ResultatGate r = new GatesEtude.GateDecomposition(prixDpuRepository).evaluer(ContexteGate.deArticles(List.of(a)));

        assertThat(r.problemes()).singleElement()
                .extracting(ResultatGate.ProblemeGate::message)
                .isEqualTo("etudes.gate.decomposition.rendements_nuls");
    }

    @Test
    void decomposition_avec_un_rendement_utile_passe() {
        UUID dpuId = UUID.randomUUID();
        DpgfNoeud a = article("1-1", "m3", "70", DpgfNoeud.MODE_DECOMPOSE);
        a.setPrixDpuId(dpuId);
        PrixDpu dpu = PrixDpu.builder().id(dpuId).build();
        dpu.setComposants(List.of(
                ComposantDpu.builder().rendement(new BigDecimal("350")).build(),
                ComposantDpu.builder().rendement(BigDecimal.ZERO).build()));
        when(prixDpuRepository.findById(dpuId)).thenReturn(Optional.of(dpu));

        assertThat(new GatesEtude.GateDecomposition(prixDpuRepository).evaluer(ContexteGate.deArticles(List.of(a))).passe())
                .isTrue();
    }

    // ── Étape 4 — non bloquante ──────────────────────────────────────────────

    @Test
    void prix_non_consultes_avertissent_sans_bloquer() {
        UUID dpuId = UUID.randomUUID();
        DpgfNoeud a = article("1-1", "m3", "70", DpgfNoeud.MODE_DECOMPOSE);
        a.setPrixDpuId(dpuId);
        PrixDpu dpu = PrixDpu.builder().id(dpuId).build();
        dpu.setComposants(List.of(ComposantDpu.builder().sourcePrix("MANUEL").build()));
        lenient().when(prixDpuRepository.findById(any())).thenReturn(Optional.of(dpu));

        ResultatGate r = new GatesEtude.GateConsultationFournisseurs(prixDpuRepository)
                .evaluer(ContexteGate.deArticles(List.of(a)));

        assertThat(r.passe()).isFalse();
        assertThat(r.autoriseLaSuite()).isTrue();
    }

    // ── Étape 5 ──────────────────────────────────────────────────────────────

    @Test
    void chiffrage_sans_prix_de_vente_est_bloquant() {
        List<DpgfNoeud> articles = List.of(article("1-1", "m3", "70", DpgfNoeud.MODE_FOURNI));
        ResultatGate r = new GatesEtude.GateChiffrage(prixDpuRepository).evaluer(ContexteGate.deArticles(articles));
        assertThat(r.problemes()).singleElement()
                .extracting(ResultatGate.ProblemeGate::message)
                .isEqualTo("etudes.gate.chiffrage.prix_absent");
    }

    @Test
    void chiffrage_complet_passe() {
        DpgfNoeud a = article("1-1", "m3", "70", DpgfNoeud.MODE_FOURNI);
        a.setPrixUnitaire(new BigDecimal("849.94"));
        assertThat(new GatesEtude.GateChiffrage(prixDpuRepository).evaluer(ContexteGate.deArticles(List.of(a))).passe())
                .isTrue();
    }
}
