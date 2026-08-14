package ma.nafura.etudes.service.cps;

import java.io.IOException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;
import ma.nafura.etudes.domain.cps.CpsDocument;

/**
 * Extrait le texte d'un PDF et qualifie la source.
 *
 * <p>Un PDF natif porte une couche texte : l'extraction est locale, fiable, et ne consomme
 * <b>aucun token LLM</b>. Un scan pur n'en a pas — il faudrait alors passer par de la vision,
 * ce qui n'est pas fait aujourd'hui : le fichier est conserve, l'extraction automatique est
 * annoncee indisponible, et la saisie manuelle reste possible.
 *
 * <p>On ne refuse jamais le document. Le CPS vient du maitre d'ouvrage : exiger un format que
 * l'utilisateur ne maitrise pas reviendrait a le bloquer sur une piece qu'il recevra de toute
 * facon.
 */
@Component
public class ExtracteurTextePdf {

    /**
     * En dessous de ce nombre de caracteres par page, il n'y a pas de couche texte
     * exploitable : le PDF est une image.
     */
    static final int SEUIL_SCAN_IMAGE = 100;

    /**
     * Entre ce seuil et le precedent, la couche texte existe mais est pauvre : typiquement un
     * scan passe a l'OCR, exploitable avec reserve.
     */
    static final int SEUIL_PDF_NATIF = 400;

    public record ResultatExtraction(
            String texte, int nbPages, int densiteTexte, String qualiteSource, String message) {

        public boolean exploitable() {
            return !CpsDocument.QUALITE_SCAN_IMAGE.equals(qualiteSource);
        }
    }

    public ResultatExtraction extraire(byte[] contenu) {
        try (PDDocument doc = Loader.loadPDF(contenu)) {
            int nbPages = doc.getNumberOfPages();
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String texte = stripper.getText(doc);

            int densite = nbPages > 0 ? texte.replaceAll("\\s", "").length() / nbPages : 0;
            String qualite = qualifier(densite);
            return new ResultatExtraction(texte, nbPages, densite, qualite, messagePour(qualite));

        } catch (IOException | RuntimeException ex) {
            // Un PDF illisible ne doit pas faire echouer le depot : le fichier est deja stocke.
            return new ResultatExtraction(
                    "", 0, 0, CpsDocument.QUALITE_INCONNUE,
                    "etudes.cps.extraction.illisible");
        }
    }

    private String qualifier(int densiteParPage) {
        if (densiteParPage < SEUIL_SCAN_IMAGE) {
            return CpsDocument.QUALITE_SCAN_IMAGE;
        }
        if (densiteParPage < SEUIL_PDF_NATIF) {
            return CpsDocument.QUALITE_SCAN_OCR;
        }
        return CpsDocument.QUALITE_PDF_NATIF;
    }

    private String messagePour(String qualite) {
        return switch (qualite) {
            case CpsDocument.QUALITE_SCAN_IMAGE -> "etudes.cps.extraction.scan_image";
            case CpsDocument.QUALITE_SCAN_OCR -> "etudes.cps.extraction.scan_ocr";
            default -> null;
        };
    }
}
