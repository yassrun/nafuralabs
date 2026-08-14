package ma.nafura.etudes.service.bordereau.grid;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Locale;
import ma.nafura.platform.documents.docextractor.grid.GridRow;
import ma.nafura.platform.documents.docextractor.grid.PdfRuledGridSource;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Le fichier de référence est un bordereau réel : un classeur converti en PDF, seize pages,
 * couche texte intacte, quadrillage vectoriel. C'est le cas courant chez nos clients.
 */
class PdfRuledGridSourceTest {

    private static List<GridRow> rows;

    @BeforeAll
    static void extract() throws IOException {
        byte[] pdf;
        try (InputStream in = PdfRuledGridSourceTest.class
                .getResourceAsStream("/bordereaux/BDP-2-17.pdf")) {
            assertThat(in).as("fixture BDP-2-17.pdf").isNotNull();
            pdf = in.readAllBytes();
        }
        rows = new PdfRuledGridSource().read(pdf);
    }

    @Test
    @DisplayName("la grille est reconstruite sur l'ensemble des pages")
    void reconstruitLaGrille() {
        assertThat(rows).hasSizeGreaterThan(200);
        assertThat(rows.stream().map(GridRow::page).distinct()).hasSizeGreaterThan(10);
        assertThat(rows.stream().mapToInt(r -> r.cells().size()).max().orElse(0))
                .as("le tableau a six colonnes")
                .isGreaterThanOrEqualTo(6);
    }

    @Test
    @DisplayName("l'en-tête du tableau est lu colonne par colonne")
    void litLEnTete() {
        GridRow header = rows.stream()
                .filter(r -> r.cells().stream()
                        .anyMatch(c -> c.toUpperCase(Locale.ROOT).startsWith("DESIGNATION")))
                .findFirst()
                .orElseThrow();

        assertThat(joined(header)).contains("DESIGNATION").contains("UNITE").contains("QUANTITE");
    }

    @Test
    @DisplayName("un libellé long n'est pas tronqué — il vient de sa cellule, pas du flux")
    void neTronquePasLesLibelles() {
        // Le parseur de flux rendait « TRANCHEERS… » : un fragment de milieu de cellule.
        boolean complet = rows.stream()
                .flatMap(r -> r.cells().stream())
                .anyMatch(c -> c.toUpperCase(Locale.ROOT).startsWith("FOUILLES EN PUITS"));

        assertThat(complet)
                .as("le libellé démarre au début de la cellule")
                .isTrue();
    }

    @Test
    @DisplayName("unité et quantité tombent dans des colonnes distinctes")
    void separeUniteEtQuantite() {
        GridRow measure = rows.stream()
                .filter(r -> r.cells().stream()
                        .anyMatch(c -> c.equalsIgnoreCase("M3")))
                .filter(r -> r.cells().stream().anyMatch(c -> c.matches("[\\d\\s\\u00a0]+,\\d+")))
                .findFirst()
                .orElseThrow();

        int uniteColumn = indexOfMatch(measure, c -> c.equalsIgnoreCase("M3"));
        int quantiteColumn = indexOfMatch(measure, c -> c.matches("[\\d\\s\\u00a0]+,\\d+"));

        assertThat(uniteColumn).isNotEqualTo(quantiteColumn);
        assertThat(quantiteColumn).isGreaterThan(uniteColumn);
    }

    @Test
    @DisplayName("les accents survivent à l'extraction")
    void preserveLesAccents() {
        boolean accents = rows.stream()
                .flatMap(r -> r.cells().stream())
                .anyMatch(c -> c.contains("É") || c.contains("È") || c.contains("Œ"));

        assertThat(accents).isTrue();
    }

    private static String joined(GridRow row) {
        return String.join(" | ", row.cells()).toUpperCase(Locale.ROOT);
    }

    private static int indexOfMatch(GridRow row, java.util.function.Predicate<String> predicate) {
        for (int i = 0; i < row.cells().size(); i++) {
            if (predicate.test(row.cell(i))) {
                return i;
            }
        }
        return -1;
    }
}
