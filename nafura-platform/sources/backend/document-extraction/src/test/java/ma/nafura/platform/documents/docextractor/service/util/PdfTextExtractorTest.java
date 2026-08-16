package ma.nafura.platform.documents.docextractor.service.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayOutputStream;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;

class PdfTextExtractorTest {

    @Test
    void tryPromptText_returnsTextForNativePdf() throws Exception {
        String body = ("LOT 1 Terrassement article beton arme quantite unite "
                + "Les ouvrages seront executes selon les prescriptions du CPS. ").repeat(4);
        byte[] pdf = minimalPdf(body);
        String text = PdfTextExtractor.tryPromptText(pdf, "bdp.pdf", 10_000);
        assertThat(text).isNotNull();
        assertThat(text).contains("Terrassement");
        assertThat(text).contains("1 pages");
    }

    @Test
    void tryPromptTextPages_restrictsRange() throws Exception {
        String p1 = "PageUneContenuSuffisantPourPasserLeSeuilMinimumDeCaracteresUtiles. ".repeat(5);
        String p2 = "PageDeuxAutreContenuSuffisantAussiPourLeSeuilDeDensiteTexte. ".repeat(5);
        byte[] pdf = twoPagePdf(p1, p2);
        String page1 = PdfTextExtractor.tryPromptTextPages(pdf, "multi.pdf", 1, 1, 10_000);
        assertThat(page1).isNotNull().contains("PageUne").doesNotContain("PageDeux");
    }

    @Test
    void tryPromptText_returnsNullForEmptyPdf() throws Exception {
        try (PDDocument doc = new PDDocument()) {
            doc.addPage(new PDPage());
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            assertThat(PdfTextExtractor.tryPromptText(out.toByteArray(), "empty.pdf")).isNull();
        }
    }

    private static byte[] minimalPdf(String line) throws Exception {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                cs.beginText();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                cs.newLineAtOffset(50, 700);
                cs.showText(line);
                cs.endText();
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }

    private static byte[] twoPagePdf(String page1, String page2) throws Exception {
        try (PDDocument doc = new PDDocument()) {
            for (String line : new String[] {page1, page2}) {
                PDPage page = new PDPage();
                doc.addPage(page);
                try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                    cs.beginText();
                    cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                    cs.newLineAtOffset(50, 700);
                    cs.showText(line);
                    cs.endText();
                }
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }
}
