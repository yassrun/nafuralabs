package ma.nafura.platform.documents.docextractor.plan;

import java.util.List;
import ma.nafura.platform.documents.docextractor.grid.GridRow;
import ma.nafura.platform.documents.docextractor.grid.PdfRuledGridSource;
import ma.nafura.platform.documents.docextractor.grid.XlsxGridSource;
import ma.nafura.platform.documents.docextractor.service.util.PdfTextExtractor;
import ma.nafura.platform.documents.docextractor.service.util.SpreadsheetTextExtractor;

/**
 * Sonde : tableur ou PDF quadrillé → grille. Liste vide = autre palier.
 */
public final class GridProbe {

    private final XlsxGridSource xlsx = new XlsxGridSource();
    private final PdfRuledGridSource pdf = new PdfRuledGridSource();

    public List<GridRow> probe(byte[] bytes, String fileName, String mimeType) {
        if (bytes == null || bytes.length == 0) {
            return List.of();
        }
        if (xlsx.supports(fileName, mimeType) || SpreadsheetTextExtractor.isTabularMime(mimeType)) {
            if (fileName != null && fileName.toLowerCase().endsWith(".csv")) {
                return List.of();
            }
            if (mimeType != null && mimeType.toLowerCase().contains("csv")) {
                return List.of();
            }
            try {
                return xlsx.read(bytes);
            } catch (RuntimeException e) {
                return List.of();
            }
        }
        if (PdfTextExtractor.isPdfMime(mimeType, fileName)) {
            return pdf.read(bytes);
        }
        return List.of();
    }
}
