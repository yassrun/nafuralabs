package ma.nafura.etudes.service.gate;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import org.junit.jupiter.api.Test;

/**
 * Structure d'un detail estimatif reel.
 *
 * <p>Source : classeur « LOT N° 2 GROS-OEUVRE », feuille D.E. — 6 chapitres, 19 sous-chapitres,
 * 84 articles, 38 variantes, 108 lignes chiffrables.
 *
 * <p>Ce que ce document a appris : la hierarchie a <b>quatre</b> niveaux, pas trois, et la
 * profondeur varie d'une branche a l'autre. Un article comme {@code a/1 Deblais en masse} porte
 * directement sa quantite ; un article comme {@code b/1 Canalisations PVC} n'en a pas et
 * delegue a ses variantes {@code a - Ø 200}, {@code b - Ø 250}.
 *
 * <p>Consequence sur le modele : <b>{@code TYPE_ARTICLE} designe un role, pas un niveau</b> —
 * celui de ligne chiffrable. Un noeud qui regroupe est LOT ou SOUS_LOT quelle que soit sa
 * profondeur. Le modele l'admet deja ({@code parentId} libre), mais l'intention doit etre
 * ecrite, sans quoi quelqu'un typera par profondeur et cassera les gates.
 */
class GateBordereauStructureReelleTest {

    private static DpgfNoeud groupe(String code, String libelle, UUID parent) {
        return DpgfNoeud.builder()
                .id(UUID.randomUUID())
                .parentId(parent)
                .type(DpgfNoeud.TYPE_SOUS_LOT)
                .code(code)
                .libelle(libelle)
                .ordre(0)
                .build();
    }

    private static DpgfNoeud ligneChiffrable(String code, String libelle, String unite, String qte, UUID parent) {
        return DpgfNoeud.builder()
                .id(UUID.randomUUID())
                .parentId(parent)
                .type(DpgfNoeud.TYPE_ARTICLE)
                .code(code)
                .libelle(libelle)
                .unite(unite)
                .quantite(new BigDecimal(qte))
                .mode(DpgfNoeud.MODE_FOURNI)
                .ordre(0)
                .build();
    }

    /** Reproduit la branche « I/ → a/ → a/1 » et « I/ → b/ → b/1 → variantes ». */
    private static List<DpgfNoeud> bordereauReel() {
        List<DpgfNoeud> tous = new ArrayList<>();

        DpgfNoeud chapitre = DpgfNoeud.builder()
                .id(UUID.randomUUID()).type(DpgfNoeud.TYPE_LOT)
                .code("I").libelle("AMENAGEMENT EXTERIEUR").ordre(0).build();
        tous.add(chapitre);

        // Branche courte : l'article porte lui-meme sa quantite.
        DpgfNoeud terrassements = groupe("a", "TERRASSEMENTS GENERAUX & DEMOLITIONS", chapitre.getId());
        tous.add(terrassements);
        tous.add(ligneChiffrable("a/1", "Deblais en masse terrain meuble", "M3", "4310", terrassements.getId()));
        tous.add(ligneChiffrable("a/2", "Mise en remblais avec materiaux", "M3", "4715", terrassements.getId()));
        tous.add(ligneChiffrable("a/4", "Implantation des batiments", "F", "1", terrassements.getId()));

        // Branche longue : l'article regroupe, les variantes sont chiffrees.
        DpgfNoeud reseau = groupe("b", "RESEAU D'EVACUATION", chapitre.getId());
        tous.add(reseau);
        DpgfNoeud canalisations = groupe("b/1", "Canalisations en tubes PVC", reseau.getId());
        tous.add(canalisations);
        tous.add(ligneChiffrable("b/1/a", "Ø 200", "ML", "120", canalisations.getId()));
        tous.add(ligneChiffrable("b/1/b", "Ø 250", "ML", "10", canalisations.getId()));

        return tous;
    }

    private static List<DpgfNoeud> articles(List<DpgfNoeud> tous) {
        return tous.stream().filter(n -> DpgfNoeud.TYPE_ARTICLE.equals(n.getType())).toList();
    }

    @Test
    void la_profondeur_varie_d_une_branche_a_l_autre() {
        List<DpgfNoeud> tous = bordereauReel();

        // a/1 est a la profondeur 3, Ø 200 a la profondeur 4 — les deux sont des ARTICLE.
        assertThat(articles(tous)).extracting(DpgfNoeud::getCode)
                .containsExactly("a/1", "a/2", "a/4", "b/1/a", "b/1/b");
    }

    @Test
    void un_article_qui_regroupe_des_variantes_n_est_pas_une_ligne_chiffrable() {
        List<DpgfNoeud> tous = bordereauReel();

        // b/1 « Canalisations PVC » est numerote comme un article mais ne porte ni unite ni
        // quantite : c'est un noeud de regroupement. Le typer ARTICLE ferait echouer le gate
        // sur une ligne qui n'a jamais eu vocation a etre chiffree.
        DpgfNoeud b1 = tous.stream().filter(n -> "b/1".equals(n.getCode())).findFirst().orElseThrow();
        assertThat(b1.getType()).isEqualTo(DpgfNoeud.TYPE_SOUS_LOT);
        assertThat(articles(tous)).extracting(DpgfNoeud::getCode).doesNotContain("b/1");
    }

    @Test
    void le_gate_bordereau_passe_sur_la_structure_reelle() {
        ResultatGate r = new GatesEtude.GateBordereau().evaluer(articles(bordereauReel()));

        assertThat(r.passe()).isTrue();
    }

    @Test
    void le_forfait_est_une_ligne_chiffrable_valide() {
        // « Le forfait : F 1 » — l'expert avait signale que certains articles se facturent
        // en ensemble. Quantite 1, unite F : le gate ne doit pas le rejeter.
        List<DpgfNoeud> forfait = List.of(
                ligneChiffrable("a/4", "Implantation des batiments", "F", "1", null));

        assertThat(new GatesEtude.GateBordereau().evaluer(forfait).passe()).isTrue();
    }

    @Test
    void une_ligne_de_total_ne_doit_jamais_arriver_jusqu_au_gate() {
        // Le detail estimatif porte des lignes « a/ - TOTAL TERRASSEMENTS... » sans unite ni
        // quantite. Importees comme ARTICLE, elles bloqueraient le parcours sur des lignes qui
        // ne sont pas des ouvrages. C'est a l'import de les ecarter — ce test documente la
        // consequence si on l'oublie.
        List<DpgfNoeud> avecTotal = new ArrayList<>(articles(bordereauReel()));
        avecTotal.add(DpgfNoeud.builder()
                .id(UUID.randomUUID()).type(DpgfNoeud.TYPE_ARTICLE)
                .code(null).libelle("a/ - TOTAL TERRASSEMENTS GENERAUX & DEMOLITIONS")
                .ordre(99).build());

        ResultatGate r = new GatesEtude.GateBordereau().evaluer(avecTotal);

        assertThat(r.passe()).isFalse();
        assertThat(r.problemes()).singleElement()
                .extracting(ResultatGate.ProblemeGate::libelle)
                .asString().contains("TOTAL");
    }
}
