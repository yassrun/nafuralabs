package ma.nafura.platform.documents.docextractor.grid;

import java.awt.geom.Point2D;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.apache.pdfbox.contentstream.PDFGraphicsStreamEngine;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.graphics.image.PDImage;

/**
 * Relève les traits du quadrillage d'une page PDF.
 *
 * <p>Un bordereau imprimé depuis un tableur conserve son tableau sous forme de segments
 * vectoriels. Les retrouver permet de reconstruire les cellules, donc de lire chaque valeur dans
 * sa colonne — au lieu de deviner les colonnes dans un flux de texte, ce qui coupe les libellés
 * longs en fragments.
 *
 * <p>Deux formes coexistent dans la nature et sont traitées ensemble : les traits réellement
 * tracés ({@code moveTo}/{@code lineTo} puis {@code stroke}), et les rectangles très fins
 * remplis, que beaucoup de générateurs utilisent à la place d'une bordure.
 *
 * <p>Les coordonnées reçues ici sont en espace utilisateur, origine en bas à gauche. Elles sont
 * converties en repère écran (origine en haut à gauche) pour s'aligner sur celles que produit
 * l'extraction de texte.
 */
final class PdfRulingCollector extends PDFGraphicsStreamEngine {

    /** Au-delà, un trait n'est plus une bordure mais une forme. */
    private static final double MAX_THICKNESS = 2.5d;
    /** En deçà, c'est un artefact de tracé, pas une bordure de cellule. */
    private static final double MIN_LENGTH = 4d;

    private final List<double[]> horizontals = new ArrayList<>();
    private final List<double[]> verticals = new ArrayList<>();
    private final List<Point2D> currentPath = new ArrayList<>();
    private final double pageHeight;

    private Point2D currentPoint = new Point2D.Double();

    PdfRulingCollector(PDPage page) {
        super(page);
        this.pageHeight = page.getMediaBox().getHeight();
    }

    /** Segments horizontaux, chacun {@code {y, xStart, xEnd}}, en repère écran. */
    List<double[]> horizontals() {
        return horizontals;
    }

    /** Segments verticaux, chacun {@code {x, yStart, yEnd}}, en repère écran. */
    List<double[]> verticals() {
        return verticals;
    }

    void collect() throws IOException {
        processPage(getPage());
    }

    // ── construction du chemin ──────────────────────────────────────────────

    @Override
    public void moveTo(float x, float y) {
        currentPoint = new Point2D.Double(x, y);
        currentPath.clear();
        currentPath.add(currentPoint);
    }

    @Override
    public void lineTo(float x, float y) {
        currentPoint = new Point2D.Double(x, y);
        currentPath.add(currentPoint);
    }

    @Override
    public void appendRectangle(Point2D p0, Point2D p1, Point2D p2, Point2D p3) {
        // Un rectangle très fin est une bordure déguisée : on le réduit à son axe.
        double minX = min(p0.getX(), p1.getX(), p2.getX(), p3.getX());
        double maxX = max(p0.getX(), p1.getX(), p2.getX(), p3.getX());
        double minY = min(p0.getY(), p1.getY(), p2.getY(), p3.getY());
        double maxY = max(p0.getY(), p1.getY(), p2.getY(), p3.getY());
        double width = maxX - minX;
        double height = maxY - minY;

        if (height <= MAX_THICKNESS && width >= MIN_LENGTH) {
            addHorizontal((minY + maxY) / 2d, minX, maxX);
        } else if (width <= MAX_THICKNESS && height >= MIN_LENGTH) {
            addVertical((minX + maxX) / 2d, minY, maxY);
        } else if (width >= MIN_LENGTH && height >= MIN_LENGTH) {
            // Cellule dessinée comme un rectangle plein : ses quatre côtés sont des bordures.
            addHorizontal(minY, minX, maxX);
            addHorizontal(maxY, minX, maxX);
            addVertical(minX, minY, maxY);
            addVertical(maxX, minY, maxY);
        }
        currentPath.clear();
    }

    @Override
    public void curveTo(float x1, float y1, float x2, float y2, float x3, float y3) {
        // Une courbe n'est jamais une bordure de tableau : on ferme le segment en cours.
        currentPath.clear();
        currentPoint = new Point2D.Double(x3, y3);
    }

    @Override
    public Point2D getCurrentPoint() {
        return currentPoint;
    }

    @Override
    public void closePath() {
        if (currentPath.size() > 1) {
            currentPath.add(currentPath.get(0));
        }
    }

    @Override
    public void endPath() {
        currentPath.clear();
    }

    // ── validation du chemin ────────────────────────────────────────────────

    @Override
    public void strokePath() {
        flushPath();
    }

    @Override
    public void fillPath(int windingRule) {
        flushPath();
    }

    @Override
    public void fillAndStrokePath(int windingRule) {
        flushPath();
    }

    private void flushPath() {
        for (int i = 0; i + 1 < currentPath.size(); i++) {
            Point2D a = currentPath.get(i);
            Point2D b = currentPath.get(i + 1);
            double dx = Math.abs(a.getX() - b.getX());
            double dy = Math.abs(a.getY() - b.getY());
            if (dy <= MAX_THICKNESS && dx >= MIN_LENGTH) {
                addHorizontal((a.getY() + b.getY()) / 2d,
                        Math.min(a.getX(), b.getX()), Math.max(a.getX(), b.getX()));
            } else if (dx <= MAX_THICKNESS && dy >= MIN_LENGTH) {
                addVertical((a.getX() + b.getX()) / 2d,
                        Math.min(a.getY(), b.getY()), Math.max(a.getY(), b.getY()));
            }
        }
        currentPath.clear();
    }

    /** Conversion en repère écran : l'axe y du PDF monte, celui du texte descend. */
    private void addHorizontal(double y, double xStart, double xEnd) {
        horizontals.add(new double[] {pageHeight - y, xStart, xEnd});
    }

    private void addVertical(double x, double yStart, double yEnd) {
        verticals.add(new double[] {x, pageHeight - yEnd, pageHeight - yStart});
    }

    // ── ignoré : rien de tout cela ne dessine un tableau ────────────────────

    @Override
    public void drawImage(PDImage pdImage) {
        // Sans objet : une image ne porte pas de quadrillage exploitable.
    }

    @Override
    public void clip(int windingRule) {
        // Le rognage ne crée pas de bordure.
    }

    @Override
    public void shadingFill(COSName shadingName) {
        // Un dégradé n'est pas une bordure.
    }

    private static double min(double a, double b, double c, double d) {
        return Math.min(Math.min(a, b), Math.min(c, d));
    }

    private static double max(double a, double b, double c, double d) {
        return Math.max(Math.max(a, b), Math.max(c, d));
    }
}
