package ma.nafura.platform.documents.docextractor.grid;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiConsumer;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Reconstruit la grille d'un PDF quadrillé, puis lit chaque valeur dans sa cellule.
 *
 * <p>Un bordereau converti depuis un tableur — le cas courant — conserve son tableau sous forme
 * de traits vectoriels et sa couche texte intacte. On retrouve donc les cellules exactement, sans
 * inférer les colonnes à partir des positions du texte, et sans modèle de vision.
 *
 * <p>Quand la page ne porte pas de quadrillage exploitable, la source rend une liste vide plutôt
 * qu'un résultat approximatif : c'est au niveau supérieur de choisir une autre source. Un
 * silence franc vaut mieux qu'une grille inventée.
 */
public final class PdfRuledGridSource {

    private static final Logger log = LoggerFactory.getLogger(PdfRuledGridSource.class);

    /** Deux traits distants de moins de ça sont le même trait dessiné plusieurs fois. */
    private static final double SNAP = 2.5d;
    /** Un trait plus court n'est pas une bordure de tableau. */
    private static final double MIN_RULE_SPAN = 8d;
    /** Deux arêtes plus proches que ça ne délimitent aucune colonne réelle. */
    private static final double MIN_COLUMN_WIDTH = 12d;
    /** En deçà, la page n'a pas de tableau : deux colonnes et deux lignes au minimum. */
    private static final int MIN_LINES = 3;

    /**
     * Lit toutes les pages quadrillées du document.
     *
     * <p>Les positions des colonnes ne peuvent pas être arrêtées pour le document entier : un
     * bordereau est souvent l'assemblage de plusieurs fichiers aux marges différentes, et les
     * abscisses varient d'un bloc de pages à l'autre. Ce qui est stable, c'est le <em>nombre</em>
     * de colonnes. On le relève sur l'ensemble du document, puis on y ramène les pages qui en
     * annoncent davantage — elles portent des traits parasites, pas de vraies colonnes.
     *
     * @return les lignes reconstruites, vides si aucune page n'est exploitable
     */
    public List<GridRow> read(byte[] content) {
        return read(content, (done, total) -> { });
    }

    /**
     * @param onPage informé après chaque page lue — la lecture d'un DCE de plusieurs centaines de
     *     pages ne doit pas laisser l'utilisateur devant une barre figée
     */
    public List<GridRow> read(byte[] content, BiConsumer<Integer, Integer> onPage) {
        try (PDDocument document = Loader.loadPDF(content)) {
            int pageCount = document.getNumberOfPages();
            // Deux passes sur chaque page : relevé des traits, puis lecture du texte.
            int steps = pageCount * 2;
            int done = 0;

            List<List<double[]>> horizontalsByPage = new ArrayList<>(pageCount);
            List<List<Edge>> columnsByPage = new ArrayList<>(pageCount);
            for (int i = 0; i < pageCount; i++) {
                PdfRulingCollector rulings = new PdfRulingCollector(document.getPage(i));
                rulings.collect();
                horizontalsByPage.add(rulings.horizontals());
                columnsByPage.add(clusterEdges(rulings.verticals()));
                onPage.accept(++done, steps);
            }

            int expected = modalEdgeCount(columnsByPage);
            if (expected < 2) {
                return List.of();
            }

            List<GridRow> rows = new ArrayList<>();
            for (int i = 0; i < pageCount; i++) {
                List<Double> columns = strongest(columnsByPage.get(i), expected);
                if (columns.size() >= 2) {
                    rows.addAll(readPage(document, i, horizontalsByPage.get(i), columns));
                }
                onPage.accept(++done, steps);
            }
            return rows;
        } catch (IOException e) {
            log.warn("PDF illisible pour la reconstruction de grille : {}", e.getMessage());
            return List.of();
        }
    }

    /** Une arête de colonne, avec la longueur totale de trait qui la soutient. */
    private record Edge(double position, double span) {}

    /** Nombre d'arêtes le plus fréquent parmi les pages quadrillées. */
    private static int modalEdgeCount(List<List<Edge>> columnsByPage) {
        Map<Integer, Integer> counts = new HashMap<>();
        for (List<Edge> edges : columnsByPage) {
            if (edges.size() >= 3) {
                counts.merge(edges.size(), 1, Integer::sum);
            }
        }
        return counts.entrySet().stream()
                .max(Map.Entry.<Integer, Integer>comparingByValue()
                        .thenComparing(Map.Entry.comparingByKey()))
                .map(Map.Entry::getKey)
                .orElse(0);
    }

    /**
     * Ramène une page au nombre d'arêtes attendu en ne retirant que des arêtes intérieures.
     *
     * <p>Retirer une arête intérieure fusionne deux cellules voisines : au pire deux valeurs se
     * retrouvent dans la même case, rien n'est perdu. Retirer une arête de bord, en revanche,
     * met tout le texte au-delà hors du tableau — il disparaît. Les deux extrêmes sont donc
     * conservées quoi qu'il arrive, et l'arbitrage se fait sur la longueur cumulée de trait :
     * une vraie bordure court sur la hauteur du tableau, un soulignement fait quelques points.
     */
    private static List<Double> strongest(List<Edge> edges, int expected) {
        if (edges.size() <= expected || edges.size() < 3) {
            return edges.stream().map(Edge::position).toList();
        }
        List<Edge> interior = new ArrayList<>(edges.subList(1, edges.size() - 1));
        interior.sort(Comparator.comparingDouble(Edge::span).reversed());

        List<Double> selected = new ArrayList<>();
        selected.add(edges.get(0).position());
        selected.add(edges.get(edges.size() - 1).position());
        for (Edge edge : interior.subList(0, Math.min(expected - 2, interior.size()))) {
            selected.add(edge.position());
        }
        Collections.sort(selected);
        return selected;
    }

    private List<GridRow> readPage(
            PDDocument document, int pageIndex, List<double[]> horizontals, List<Double> columnEdges)
            throws IOException {
        PDPage page = document.getPage(pageIndex);
        String pageLabel = "p" + (pageIndex + 1);

        List<Double> rowEdges = cluster(horizontals);
        if (rowEdges.size() < MIN_LINES) {
            return List.of();
        }
        // Les bandes extrêmes courent jusqu'au bord : un caractère qui dépasse légèrement la
        // bordure appartient à sa colonne, il ne doit pas disparaître.
        columnEdges = new ArrayList<>(columnEdges);
        columnEdges.set(0, 0d);
        columnEdges.set(columnEdges.size() - 1, (double) page.getMediaBox().getWidth());

        List<TextPosition> glyphs = glyphsOf(document, pageIndex);
        if (glyphs.isEmpty()) {
            return List.of();
        }

        int rowCount = rowEdges.size() - 1;
        int columnCount = columnEdges.size() - 1;
        StringBuilder[][] cells = new StringBuilder[rowCount][columnCount];

        for (TextPosition glyph : glyphs) {
            double x = glyph.getXDirAdj() + glyph.getWidthDirAdj() / 2d;
            double y = glyph.getYDirAdj() - glyph.getHeightDir() / 2d;
            int row = bandOf(rowEdges, y);
            int column = bandOf(columnEdges, x);
            if (row < 0 || column < 0) {
                continue;
            }
            if (cells[row][column] == null) {
                cells[row][column] = new StringBuilder();
            }
            cells[row][column].append(glyph.getUnicode());
        }

        List<GridRow> rows = new ArrayList<>(rowCount);
        for (int r = 0; r < rowCount; r++) {
            List<String> values = new ArrayList<>(columnCount);
            boolean any = false;
            for (int c = 0; c < columnCount; c++) {
                String value = cells[r][c] == null ? "" : normalize(cells[r][c].toString());
                values.add(value);
                any |= !value.isEmpty();
            }
            if (any) {
                rows.add(GridRow.of(pageLabel, r + 1, values));
            }
        }
        return rows;
    }

    /**
     * Regroupe les coordonnées voisines en une seule arête, en cumulant la longueur de trait.
     *
     * <p>Un même trait est souvent tracé plusieurs fois, à quelques centièmes de point près —
     * une bordure partagée entre deux cellules adjacentes, par exemple. Sans ce regroupement on
     * obtiendrait des centaines de colonnes larges de rien. Le regroupement se fait à
     * {@link #MIN_COLUMN_WIDTH} : deux arêtes distantes de trois points ne délimitent aucune
     * colonne réelle.
     */
    private static List<Edge> clusterEdges(List<double[]> segments) {
        List<double[]> kept = new ArrayList<>();
        for (double[] segment : segments) {
            double span = segment[2] - segment[1];
            if (span >= MIN_RULE_SPAN) {
                kept.add(new double[] {segment[0], span});
            }
        }
        if (kept.isEmpty()) {
            return List.of();
        }
        kept.sort(Comparator.comparingDouble(s -> s[0]));

        List<Edge> edges = new ArrayList<>();
        double weighted = kept.get(0)[0];
        double span = kept.get(0)[1];
        int count = 1;
        double anchor = kept.get(0)[0];
        for (int i = 1; i < kept.size(); i++) {
            double position = kept.get(i)[0];
            if (position - anchor <= MIN_COLUMN_WIDTH) {
                weighted += position;
                span += kept.get(i)[1];
                count++;
            } else {
                edges.add(new Edge(weighted / count, span));
                weighted = position;
                span = kept.get(i)[1];
                count = 1;
                anchor = position;
            }
        }
        edges.add(new Edge(weighted / count, span));
        return edges;
    }

    /** Regroupe les ordonnées voisines : bornes des lignes du tableau. */
    private static List<Double> cluster(List<double[]> segments) {
        List<Double> positions = new ArrayList<>();
        for (double[] segment : segments) {
            if (segment[2] - segment[1] >= MIN_RULE_SPAN) {
                positions.add(segment[0]);
            }
        }
        if (positions.isEmpty()) {
            return List.of();
        }
        Collections.sort(positions);

        List<Double> edges = new ArrayList<>();
        double sum = positions.get(0);
        int count = 1;
        double last = positions.get(0);
        for (int i = 1; i < positions.size(); i++) {
            double current = positions.get(i);
            if (current - last <= SNAP) {
                sum += current;
                count++;
            } else {
                edges.add(sum / count);
                sum = current;
                count = 1;
            }
            last = current;
        }
        edges.add(sum / count);
        return edges;
    }

    /**
     * Index de la bande contenant {@code value}, ou -1 si en dehors du tableau.
     *
     * <p>Bornes strictes, sans tolérance : desserrer la borne haute ferait déborder chaque bande
     * sur la suivante, et comme la recherche va de gauche à droite, la bande de gauche
     * l'emporterait. Un libellé qui commence pile sur la bordure y perdrait sa première lettre —
     * « NTERRUPTEUR » au lieu d'« INTERRUPTEUR ». Les bandes extrêmes couvrent déjà toute la
     * largeur de la page, rien ne peut tomber en dehors par la gauche ou par la droite.
     */
    private static int bandOf(List<Double> edges, double value) {
        for (int i = 0; i + 1 < edges.size(); i++) {
            if (value >= edges.get(i) && value < edges.get(i + 1)) {
                return i;
            }
        }
        return -1;
    }

    private static List<TextPosition> glyphsOf(PDDocument document, int pageIndex)
            throws IOException {
        List<TextPosition> glyphs = new ArrayList<>();
        PDFTextStripper stripper = new PDFTextStripper() {
            @Override
            protected void writeString(String text, List<TextPosition> positions) {
                glyphs.addAll(positions);
            }
        };
        stripper.setSortByPosition(true);
        stripper.setStartPage(pageIndex + 1);
        stripper.setEndPage(pageIndex + 1);
        stripper.getText(document);
        return glyphs;
    }

    private static String normalize(String raw) {
        return raw.replace(' ', ' ').replaceAll("\\s+", " ").trim();
    }
}
