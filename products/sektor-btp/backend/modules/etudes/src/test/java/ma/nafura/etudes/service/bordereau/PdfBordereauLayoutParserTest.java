package ma.nafura.etudes.service.bordereau;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.List;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;

class PdfBordereauLayoutParserTest {

    private final PdfBordereauLayoutParser parser = new PdfBordereauLayoutParser();

    @Test
    void parse_extractsArticlesWithIrregularCodesAndFrenchQty() throws Exception {
        byte[] pdf = sampleBordereauPdf();
        BordereauParseResult result = parser.parse(pdf);

        assertThat(result.quality()).isEqualTo(BordereauParseResult.Quality.USABLE);
        assertThat(result.pageCount()).isEqualTo(1);

        List<BordereauRowCandidate> articles = result.articleCandidates();
        assertThat(articles)
                .as("articles=%s", articles.stream()
                        .map(a -> a.code() + "|" + a.libelle() + "|" + a.unite() + "|" + a.quantite())
                        .toList())
                .hasSizeGreaterThanOrEqualTo(3);

        assertThat(articles)
                .anySatisfy(a -> {
                    assertThat(a.code()).isEqualTo("1-1-1");
                    assertThat(a.libelle()).containsIgnoringCase("FOUILLES");
                    assertThat(a.unite()).isEqualTo("M3");
                    assertThat(a.quantite()).isEqualByComparingTo(new BigDecimal("10"));
                });

        assertThat(articles)
                .anySatisfy(a -> {
                    assertThat(a.code()).isIn("1.2.1a", "1.2.1A");
                    assertThat(a.unite()).isEqualTo("U");
                    assertThat(a.quantite()).isEqualByComparingTo(new BigDecimal("12.5"));
                });

        assertThat(articles)
                .anySatisfy(a -> {
                    assertThat(a.code()).isEqualTo("1-2-2");
                    assertThat(a.unite()).isEqualTo("ML");
                    assertThat(a.quantite()).isEqualByComparingTo(new BigDecimal("5600"));
                });

        assertThat(articles)
                .filteredOn(BordereauRowCandidate::hasPricing)
                .hasSizeGreaterThanOrEqualTo(3);
    }

    @Test
    void parse_rejectsEmptyPdf() throws Exception {
        try (PDDocument doc = new PDDocument()) {
            doc.addPage(new PDPage());
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            BordereauParseResult result = parser.parse(out.toByteArray());
            assertThat(result.usableForHybrid()).isFalse();
            assertThat(result.quality()).isIn(
                    BordereauParseResult.Quality.INSUFFICIENT,
                    BordereauParseResult.Quality.FAILED);
        }
    }

    @Test
    void parseQty_supportsFrenchThousands() {
        assertThat(PdfBordereauLayoutParser.parseQty("5 600,00"))
                .isEqualByComparingTo(new BigDecimal("5600"));
        assertThat(PdfBordereauLayoutParser.parseQty("10,00"))
                .isEqualByComparingTo(new BigDecimal("10"));
        assertThat(PdfBordereauLayoutParser.normalizeUnit("m\u00B3")).isEqualTo("M3");
        assertThat(PdfBordereauLayoutParser.normalizeUnit("E")).isEqualTo("ENS");
    }

    /**
     * Synthetic BDP-like page: headers + irregular codes + FR quantities on aligned columns.
     */
    private static byte[] sampleBordereauPdf() throws Exception {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                float y = 780;
                writeRow(cs, font, y, null, "BORDEREAU DES PRIX - DETAIL ESTIMATIF", null, null);
                y -= 28;
                writeRow(cs, font, y, "N", "DESIGNATION DES OUVRAGES", "UNITE", "QUANTITE");
                y -= 30;
                writeRow(cs, font, y, null, "SOUS LOT N 1: TERRASSEMENT", null, null);
                y -= 28;
                writeRow(cs, font, y, "1-1-1", "FOUILLES EN PUITS ET TRANCHEES", "M3", "10,00");
                y -= 28;
                writeRow(cs, font, y, "1.2.1a", "REGARD EN BETON 40x40", "U", "12,50");
                y -= 28;
                writeRow(cs, font, y, "1-2-2", "CANALISATION PVC DIAMETRE 160 MM", "ML", "5 600,00");
                y -= 28;
                writeRow(cs, font, y, "2-1-1", "ISOLATION THERMIQUE DES PAROIS", "M2", "200,00");
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }

    private static void writeRow(
            PDPageContentStream cs,
            PDType1Font font,
            float y,
            String code,
            String designation,
            String unit,
            String qty) throws Exception {
        if (code != null) {
            writeAt(cs, font, 10, 45, y, code);
        }
        if (designation != null) {
            writeAt(cs, font, 10, 100, y, designation);
        }
        if (unit != null) {
            writeAt(cs, font, 10, 385, y, unit);
        }
        if (qty != null) {
            writeAt(cs, font, 10, 455, y, qty);
        }
    }

    private static void writeAt(
            PDPageContentStream cs, PDType1Font font, float size, float x, float y, String text)
            throws Exception {
        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
    }
}
