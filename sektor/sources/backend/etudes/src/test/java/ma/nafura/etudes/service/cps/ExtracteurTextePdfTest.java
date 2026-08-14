package ma.nafura.etudes.service.cps;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import ma.nafura.etudes.domain.cps.CpsDocument;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;

/**
 * La qualification de la source decide de ce qu'on promet a l'utilisateur : extraction fiable,
 * extraction a verifier, ou extraction indisponible. Se tromper ici, c'est soit refuser un
 * document exploitable, soit presenter comme acquis un descriptif tire d'un scan illisible.
 */
class ExtracteurTextePdfTest {

    private final ExtracteurTextePdf extracteur = new ExtracteurTextePdf();

    @Test
    void un_pdf_avec_couche_texte_dense_est_qualifie_natif() throws IOException {
        byte[] pdf = pdfAvecTexte(("Les betons seront conformes a la norme en vigueur. "
                + "Le dosage minimal en ciment CPJ 45 est fixe a 400 kilogrammes par metre cube. ")
                .repeat(6));

        var r = extracteur.extraire(pdf);

        assertThat(r.qualiteSource()).isEqualTo(CpsDocument.QUALITE_PDF_NATIF);
        assertThat(r.exploitable()).isTrue();
        assertThat(r.texte()).contains("CPJ 45");
        assertThat(r.nbPages()).isEqualTo(1);
        assertThat(r.message()).isNull();
    }

    @Test
    void un_pdf_sans_texte_est_qualifie_scan_image_et_reste_conserve() throws IOException {
        byte[] pdf = pdfVide();

        var r = extracteur.extraire(pdf);

        assertThat(r.qualiteSource()).isEqualTo(CpsDocument.QUALITE_SCAN_IMAGE);
        // Non exploitable pour l'indexation, mais on ne refuse jamais le document :
        // le CPS vient du maitre d'ouvrage, l'utilisateur ne choisit pas son format.
        assertThat(r.exploitable()).isFalse();
        assertThat(r.message()).isEqualTo("etudes.cps.extraction.scan_image");
    }

    @Test
    void un_contenu_illisible_ne_fait_pas_echouer_le_depot() {
        var r = extracteur.extraire("ceci n'est pas un pdf".getBytes());

        assertThat(r.qualiteSource()).isEqualTo(CpsDocument.QUALITE_INCONNUE);
        assertThat(r.message()).isEqualTo("etudes.cps.extraction.illisible");
        assertThat(r.texte()).isEmpty();
    }

    @Test
    void la_densite_est_mesuree_par_page() throws IOException {
        byte[] pdf = pdfAvecTexte("Prescriptions techniques particulieres du present marche. ".repeat(4));

        var r = extracteur.extraire(pdf);

        // Sert a mesurer, sur de vrais CPS, quelle part est scannee — donc si la conversion
        // scan -> texte vaut l'effort.
        assertThat(r.densiteTexte()).isGreaterThan(0);
    }

    private byte[] pdfAvecTexte(String texte) throws IOException {
        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                cs.beginText();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 9);
                cs.setLeading(11f);
                cs.newLineAtOffset(40, 750);
                for (String ligne : decouper(texte, 90)) {
                    cs.showText(ligne);
                    cs.newLine();
                }
                cs.endText();
            }
            doc.save(out);
            return out.toByteArray();
        }
    }

    private byte[] pdfVide() throws IOException {
        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            doc.addPage(new PDPage());
            doc.save(out);
            return out.toByteArray();
        }
    }

    private static java.util.List<String> decouper(String s, int taille) {
        java.util.List<String> lignes = new java.util.ArrayList<>();
        for (int i = 0; i < s.length(); i += taille) {
            lignes.add(s.substring(i, Math.min(i + taille, s.length())));
        }
        return lignes;
    }
}
