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
    void sans_bdp_ni_cps_est_bloquant() {
        ResultatGate r = new GatesEtude.GateDocuments().evaluer(ContexteGate.documents(false, false));

        assertThat(r.passe()).isFalse();
        assertThat(r.bloquant()).isTrue();
        assertThat(r.problemes()).extracting(ResultatGate.ProblemeGate::message)
                .containsExactly(
                        "etudes.gate.documents.bordereau_manquant",
                        "etudes.gate.documents.cps_manquant");
    }

    @Test
    void bordereau_seul_ne_suffit_pas() {
        ResultatGate r = new GatesEtude.GateDocuments().evaluer(ContexteGate.documents(true, false));

        assertThat(r.passe()).isFalse();
        assertThat(r.problemes()).singleElement()
                .extracting(ResultatGate.ProblemeGate::message)
                .isEqualTo("etudes.gate.documents.cps_manquant");
    }

    @Test
    void cps_seul_ne_suffit_pas() {
        ResultatGate r = new GatesEtude.GateDocuments().evaluer(ContexteGate.documents(false, true));

        assertThat(r.passe()).isFalse();
        assertThat(r.problemes()).singleElement()
                .extracting(ResultatGate.ProblemeGate::message)
                .isEqualTo("etudes.gate.documents.bordereau_manquant");
    }

    @Test
    void bdp_et_cps_franchissent_l_etape_documents() {
        ResultatGate r = new GatesEtude.GateDocuments().evaluer(ContexteGate.documents(true, true));

        assertThat(r.passe()).isTrue();
    }

    @Test
    void piece_obligatoire_non_liee_bloque() {
        var piece = ma.nafura.etudes.domain.model.DossierPieceAttendue.builder()
                .id(UUID.randomUUID())
                .type("REGLEMENT")
                .libelle("Règlement")
                .obligatoire(true)
                .source("IA")
                .build();
        ResultatGate r = new GatesEtude.GateDocuments()
                .evaluer(ContexteGate.documents(true, true, List.of(piece)));

        assertThat(r.passe()).isFalse();
        assertThat(r.problemes()).singleElement()
                .extracting(ResultatGate.ProblemeGate::message)
                .isEqualTo("etudes.gate.documents.piece_obligatoire_manquante");
        assertThat(r.problemes().get(0).noeudId()).isEqualTo(piece.getId());
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

    @Test
    void lot_sans_article_et_code_duplique_sont_bloquants() {
        UUID lotId = UUID.randomUUID();
        DpgfNoeud lot = DpgfNoeud.builder()
                .id(lotId)
                .type(DpgfNoeud.TYPE_LOT)
                .code("L1")
                .libelle("Lot vide")
                .ordre(0)
                .build();
        DpgfNoeud a1 = article("X", "u", "1", DpgfNoeud.MODE_FOURNI);
        DpgfNoeud a2 = article("X", "u", "2", DpgfNoeud.MODE_FOURNI);
        a1.setParentId(UUID.randomUUID());
        a2.setParentId(a1.getParentId());

        ResultatGate r = new GatesEtude.GateBordereau()
                .evaluer(ContexteGate.deNoeuds(List.of(lot, a1, a2)));

        assertThat(r.passe()).isFalse();
        assertThat(r.problemes()).extracting(ResultatGate.ProblemeGate::message)
                .contains("etudes.gate.bordereau.lot_vide", "etudes.gate.bordereau.code_duplique");
    }

    @Test
    void lot_racine_avec_article_ne_provoque_pas_de_npe() {
        UUID lotId = UUID.randomUUID();
        DpgfNoeud lot = DpgfNoeud.builder()
                .id(lotId)
                .type(DpgfNoeud.TYPE_LOT)
                .code("L1")
                .libelle("Lot rempli")
                .ordre(0)
                .build();
        DpgfNoeud a = article("1-1", "m3", "10", DpgfNoeud.MODE_FOURNI);
        a.setParentId(lotId);

        ResultatGate r = new GatesEtude.GateBordereau()
                .evaluer(ContexteGate.deNoeuds(List.of(lot, a)));

        assertThat(r.passe()).isTrue();
    }

    // ── Étape 3 ──────────────────────────────────────────────────────────────

    @Test
    void article_fourni_avec_prix_ne_reclame_pas_de_decomposition() {
        DpgfNoeud a = article("1-1", "m3", "70", DpgfNoeud.MODE_FOURNI);
        a.setPrixUnitaire(new BigDecimal("120.00"));
        ResultatGate r = new GatesEtude.GateDecomposition(prixDpuRepository)
                .evaluer(ContexteGate.deArticles(List.of(a)));
        assertThat(r.passe()).isTrue();
    }

    @Test
    void article_fourni_sans_prix_est_bloquant() {
        List<DpgfNoeud> articles = List.of(article("1-1", "m3", "70", DpgfNoeud.MODE_FOURNI));
        ResultatGate r = new GatesEtude.GateDecomposition(prixDpuRepository)
                .evaluer(ContexteGate.deArticles(articles));
        assertThat(r.problemes()).singleElement()
                .extracting(ResultatGate.ProblemeGate::message)
                .isEqualTo("etudes.gate.chiffrage.prix_absent");
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
    void decomposition_avec_rendement_utile_mais_sans_prix_est_bloquante() {
        UUID dpuId = UUID.randomUUID();
        DpgfNoeud a = article("1-1", "m3", "70", DpgfNoeud.MODE_DECOMPOSE);
        a.setPrixDpuId(dpuId);
        PrixDpu dpu = PrixDpu.builder().id(dpuId).build();
        dpu.setComposants(List.of(
                ComposantDpu.builder().rendement(new BigDecimal("350")).build()));
        when(prixDpuRepository.findById(dpuId)).thenReturn(Optional.of(dpu));

        ResultatGate r = new GatesEtude.GateDecomposition(prixDpuRepository)
                .evaluer(ContexteGate.deArticles(List.of(a)));

        assertThat(r.problemes()).singleElement()
                .extracting(ResultatGate.ProblemeGate::message)
                .isEqualTo("etudes.gate.chiffrage.prix_absent");
    }

    @Test
    void decomposition_avec_un_rendement_utile_et_prix_passe() {
        UUID dpuId = UUID.randomUUID();
        DpgfNoeud a = article("1-1", "m3", "70", DpgfNoeud.MODE_DECOMPOSE);
        a.setPrixDpuId(dpuId);
        a.setPrixUnitaire(new BigDecimal("849.94"));
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

    @Test
    void articles_en_prix_fourni_sont_ignores_par_la_gate_consultation() {
        UUID dpuId = UUID.randomUUID();
        DpgfNoeud a = article("1-1", "m3", "70", DpgfNoeud.MODE_FOURNI);
        a.setPrixDpuId(dpuId);
        PrixDpu dpu = PrixDpu.builder().id(dpuId).build();
        dpu.setComposants(List.of(ComposantDpu.builder().sourcePrix("MANUEL").build()));
        lenient().when(prixDpuRepository.findById(any())).thenReturn(Optional.of(dpu));

        ResultatGate r = new GatesEtude.GateConsultationFournisseurs(prixDpuRepository)
                .evaluer(ContexteGate.deArticles(List.of(a)));

        assertThat(r.passe()).isTrue();
        assertThat(r.problemes()).isEmpty();
    }

    @Test
    void prix_consultes_franchissent_la_gate_consultation_sans_bloquer_le_parcours() {
        UUID dpuId = UUID.randomUUID();
        DpgfNoeud a = article("1-1", "m3", "70", DpgfNoeud.MODE_DECOMPOSE);
        a.setPrixDpuId(dpuId);
        PrixDpu dpu = PrixDpu.builder().id(dpuId).build();
        dpu.setComposants(List.of(ComposantDpu.builder().sourcePrix("CONSULTE").build()));
        lenient().when(prixDpuRepository.findById(any())).thenReturn(Optional.of(dpu));

        ResultatGate r = new GatesEtude.GateConsultationFournisseurs(prixDpuRepository)
                .evaluer(ContexteGate.deArticles(List.of(a)));

        assertThat(r.passe()).isTrue();
        assertThat(r.bloquant()).isFalse();
        // La consultation reste non bloquante même si des prix manuels subsistent ailleurs :
        // le chiffrage (étape 5) reste le seul verrou de soumission.
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

    @Test
    void chiffrage_fourni_avec_dpu_brouillon_sans_taux_n_est_pas_bloque() {
        UUID dpuId = UUID.randomUUID();
        DpgfNoeud a = article("1-1", "m3", "70", DpgfNoeud.MODE_FOURNI);
        a.setPrixUnitaire(new BigDecimal("100"));
        a.setPrixDpuId(dpuId);
        PrixDpu dpu = PrixDpu.builder().id(dpuId).build(); // FG/MG null
        lenient().when(prixDpuRepository.findById(dpuId)).thenReturn(Optional.of(dpu));

        ResultatGate r = new GatesEtude.GateChiffrage(prixDpuRepository)
                .evaluer(ContexteGate.avecClient(ContexteGate.deArticles(List.of(a)), true, true));

        assertThat(r.passe()).isTrue();
        assertThat(r.problemes()).isEmpty();
    }

    @Test
    void chiffrage_sans_client_est_bloquant() {
        DpgfNoeud a = article("1-1", "m3", "70", DpgfNoeud.MODE_FOURNI);
        a.setPrixUnitaire(new BigDecimal("100"));
        ResultatGate r = new GatesEtude.GateChiffrage(prixDpuRepository)
                .evaluer(ContexteGate.avecClient(ContexteGate.deArticles(List.of(a)), false, false));

        assertThat(r.passe()).isFalse();
        assertThat(r.problemes()).extracting(ResultatGate.ProblemeGate::message)
                .contains("etudes.gate.chiffrage.client_manquant");
    }

    @Test
    void chiffrage_client_invalide_est_bloquant() {
        DpgfNoeud a = article("1-1", "m3", "70", DpgfNoeud.MODE_FOURNI);
        a.setPrixUnitaire(new BigDecimal("100"));
        ResultatGate r = new GatesEtude.GateChiffrage(prixDpuRepository)
                .evaluer(ContexteGate.avecClient(ContexteGate.deArticles(List.of(a)), true, false));

        assertThat(r.passe()).isFalse();
        assertThat(r.problemes()).extracting(ResultatGate.ProblemeGate::message)
                .contains("etudes.client.introuvable");
    }
}
