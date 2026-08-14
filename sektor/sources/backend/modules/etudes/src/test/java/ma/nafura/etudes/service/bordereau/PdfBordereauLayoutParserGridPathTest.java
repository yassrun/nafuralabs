package ma.nafura.etudes.service.bordereau;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Locale;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Vérifie le point d'entrée réel du pipeline, {@code parse(byte[])} — celui qu'appelle
 * l'orchestrateur — et non les briques prises isolément.
 *
 * <p>Un PDF quadrillé doit désormais passer par la lecture de cellules. Le repli géométrique
 * reste en place pour tout le reste, et un document sans quadrillage ne doit rien perdre.
 */
class PdfBordereauLayoutParserGridPathTest {

    private static BordereauParseResult result;

    @BeforeAll
    static void parse() throws IOException {
        byte[] pdf;
        try (InputStream in = PdfBordereauLayoutParserGridPathTest.class
                .getResourceAsStream("/bordereaux/BDP-2-17.pdf")) {
            assertThat(in).as("fixture BDP-2-17.pdf").isNotNull();
            pdf = in.readAllBytes();
        }
        result = new PdfBordereauLayoutParser().parse(pdf);
    }

    @Test
    @DisplayName("le résultat est exploitable par le chemin hybride")
    void produitUnResultatExploitable() {
        assertThat(result.quality()).isEqualTo(BordereauParseResult.Quality.USABLE);
        assertThat(result.usableForHybrid()).isTrue();
        assertThat(result.rejectReason()).isNull();
        assertThat(result.pageCount()).isEqualTo(16);
    }

    @Test
    @DisplayName("186 articles, tous chiffrables — contre une poignée par l'ancien chemin")
    void extraitTousLesArticles() {
        List<BordereauRowCandidate> articles = result.articleCandidates();

        assertThat(articles).hasSize(186);
        assertThat(articles).allMatch(a -> a.libelle() != null && !a.libelle().isBlank());
        assertThat(articles.stream().filter(BordereauRowCandidate::hasPricing).count())
                .isGreaterThanOrEqualTo(184);
    }

    @Test
    @DisplayName("les lots et sous-lots accompagnent les articles")
    void extraitLaHierarchie() {
        assertThat(result.groupingCandidates()).hasSizeGreaterThan(40);
        assertThat(result.groupingCandidates())
                .anyMatch(g -> g.kind() == BordereauRowCandidate.Kind.LOT
                        && g.libelle().contains("TERRASSEMENT"));
    }

    @Test
    @DisplayName("les libellés viennent de leur cellule, entiers")
    void neTronquePlusLesLibelles() {
        // L'ancien chemin rendait « TRANCHEERS… », un fragment de milieu de cellule, ce que le
        // prompt de réparation LLM tentait ensuite de rattraper.
        assertThat(result.articleCandidates())
                .anyMatch(a -> a.libelle().toUpperCase(Locale.ROOT).startsWith("FOUILLES EN PUITS"));

        // On teste la signature réelle d'une troncature — un libellé qui démarre au milieu d'une
        // phrase — et non la brièveté : « Ø 75 » est un diamètre de canalisation parfaitement
        // valide. Une assertion qui crie au loup finit par être désactivée.
        List<String> fragments = List.of("TRANCHEERS", "PUBLIQUES", "GALVANIS", "COMPRIS ",
                "OUVRAGES ", "INFRASTRUCTURE ", "CARON", "REMBLAI ");
        assertThat(result.articleCandidates())
                .extracting(a -> a.libelle().toUpperCase(Locale.ROOT))
                .noneMatch(libelle -> fragments.stream().anyMatch(libelle::startsWith));
    }

    @Test
    @DisplayName("la provenance reste déterministe — aucun appel de modèle")
    void resteDeterministe() {
        assertThat(result.rows()).allMatch(BordereauRowCandidate::isDeterministic);
    }

    @Test
    @DisplayName("la progression est émise page par page, croissante, dans sa bande")
    void reporteLaProgression() throws IOException {
        byte[] pdf;
        try (InputStream in = PdfBordereauLayoutParserGridPathTest.class
                .getResourceAsStream("/bordereaux/BDP-2-17.pdf")) {
            pdf = in.readAllBytes();
        }
        List<Integer> percents = new java.util.ArrayList<>();
        List<String> steps = new java.util.ArrayList<>();
        new PdfBordereauLayoutParser().parse(pdf, (percent, step) -> {
            percents.add(percent);
            steps.add(step);
        });

        // Deux passes sur seize pages : la barre bouge trente-deux fois, pas une.
        assertThat(percents).hasSize(32);
        assertThat(percents).isSorted();
        assertThat(percents).allMatch(p -> p >= 8 && p <= 35);
        assertThat(steps).last().asString().contains("32/32");
    }

    @Test
    @DisplayName("un PDF vide ou illisible ne casse pas le parseur")
    void resistanceAuxEntreesInvalides() {
        PdfBordereauLayoutParser parser = new PdfBordereauLayoutParser();

        assertThat(parser.parse(null).quality()).isEqualTo(BordereauParseResult.Quality.FAILED);
        assertThat(parser.parse(new byte[0]).quality())
                .isEqualTo(BordereauParseResult.Quality.FAILED);
        assertThat(parser.parse("ceci n'est pas un pdf".getBytes()).quality())
                .isEqualTo(BordereauParseResult.Quality.FAILED);
    }
}
