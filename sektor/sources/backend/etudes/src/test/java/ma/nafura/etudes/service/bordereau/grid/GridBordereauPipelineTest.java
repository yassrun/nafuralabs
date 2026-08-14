package ma.nafura.etudes.service.bordereau.grid;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import ma.nafura.etudes.service.bordereau.BordereauRowCandidate;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Chaîne complète sur un bordereau réel — grille, colonnes, classification, assemblage.
 *
 * <p>Les nombres attendus viennent du prototype de référence
 * ({@code sektor/docs/extraction/}), qui a servi à établir les règles sur trois
 * fichiers réels avant le portage. Ce sont des chiffres constatés, pas des cibles arbitraires :
 * s'ils bougent, c'est qu'une règle a changé de comportement.
 */
class GridBordereauPipelineTest {

    private static List<BordereauRowCandidate> candidates;
    private static ColumnMap map;

    @BeforeAll
    static void run() throws IOException {
        byte[] pdf;
        try (InputStream in = GridBordereauPipelineTest.class
                .getResourceAsStream("/bordereaux/BDP-2-17.pdf")) {
            assertThat(in).as("fixture BDP-2-17.pdf").isNotNull();
            pdf = in.readAllBytes();
        }
        List<GridRow> rows = new PdfRuledGridSource().read(pdf);
        map = ColumnMap.resolve(rows);
        candidates = GridBordereauAssembler.assemble(
                rows, GridRowClassifier.classify(rows, map), map);
    }

    @Test
    @DisplayName("les colonnes sont reconnues, code compris — il n'a pourtant pas d'en-tête")
    void reconnaitLesColonnes() {
        assertThat(map.hasCode()).isTrue();
        assertThat(map.code()).isLessThan(map.designation());
        assertThat(map.designation()).isLessThan(map.unite());
        assertThat(map.unite()).isLessThan(map.quantite());
    }

    @Test
    @DisplayName("186 articles, aucun ambigu — conforme au prototype de référence")
    void retrouveLesArticles() {
        assertThat(articles()).hasSize(186);
        assertThat(kind(BordereauRowCandidate.Kind.AMBIGUOUS)).isEmpty();
    }

    @Test
    @DisplayName("les neuf lots du marché sont retrouvés (6 et 7 ouverts à la 1re section)")
    void retrouveLesLots() {
        List<String> lots = kind(BordereauRowCandidate.Kind.LOT).stream()
                .map(BordereauRowCandidate::libelle)
                .toList();

        assertThat(lots).hasSize(9);
        assertThat(lots).anyMatch(l -> l.contains("TERRASSEMENT"));
        assertThat(lots).anyMatch(l -> l.contains("ELECTRICITE"));
        assertThat(lots).anyMatch(l -> l.contains("FAUX PLAFONDS"));
        assertThat(lots).anyMatch(l -> l.contains("REVETEMENT") || l.matches("(?i).*\\b6\\b.*"));
        assertThat(lots).anyMatch(l -> l.contains("MENUISERIE") || l.matches("(?i).*\\b7\\b.*"));
    }

    @Test
    @DisplayName("un article porte son code et son libellé, la mesure venant de la ligne suivante")
    void replieLArticleSurDeuxLignes() {
        BordereauRowCandidate fouilles = articles().stream()
                .filter(c -> "1-1-1".equals(c.code()))
                .findFirst()
                .orElseThrow();

        assertThat(fouilles.libelle()).startsWith("FOUILLES EN PUITS");
        assertThat(fouilles.unite()).isEqualTo("M3");
        assertThat(fouilles.quantite()).isEqualByComparingTo("10");
    }

    @Test
    @DisplayName("« 1 000,00 » vaut mille — espace insécable et virgule décimale")
    void litLesQuantitesFrancophones() {
        assertThat(GridBordereauAssembler.parseQuantity("1 000,00"))
                .isEqualByComparingTo(new BigDecimal("1000"));
        assertThat(GridBordereauAssembler.parseQuantity("100 350,00"))
                .isEqualByComparingTo(new BigDecimal("100350"));
        assertThat(GridBordereauAssembler.parseQuantity("-")).isNull();
        assertThat(GridBordereauAssembler.parseQuantity("0")).isNull();
    }

    @Test
    @DisplayName("aucun libellé amputé de sa première lettre par une bordure de colonne")
    void neCoupePasLesLibellesSurLaBordure() {
        // Une bande de colonne qui déborde sur sa voisine volait le premier caractère :
        // « NTERRUPTEUR » au lieu d'« INTERRUPTEUR ».
        assertThat(candidates)
                .extracting(BordereauRowCandidate::libelle)
                .noneMatch(l -> l != null && l.toUpperCase(Locale.ROOT).startsWith("NTERRUPTEUR"));
    }

    @Test
    @DisplayName("presque tous les articles ont unité et quantité")
    void mesureLaCouverture() {
        long complets = articles().stream()
                .filter(c -> c.unite() != null && c.quantite() != null)
                .count();

        assertThat(complets).isGreaterThanOrEqualTo(184);
        assertThat(articles()).allMatch(c -> c.libelle() != null && !c.libelle().isBlank());
    }

    private static List<BordereauRowCandidate> articles() {
        return kind(BordereauRowCandidate.Kind.ARTICLE);
    }

    private static List<BordereauRowCandidate> kind(BordereauRowCandidate.Kind kind) {
        return candidates.stream().filter(c -> c.kind() == kind).toList();
    }
}
