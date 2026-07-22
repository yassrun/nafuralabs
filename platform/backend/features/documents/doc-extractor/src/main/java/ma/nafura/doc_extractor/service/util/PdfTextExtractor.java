package ma.nafura.platform.documents.docextractor.service.util;

import java.util.Locale;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Prefer plain text for text-layer PDFs (typical BDP/DQE). Avoids large Gemini
 * {@code inlineData} payloads that are slow and prone to TLS EOF mid-response.
 * Scanned/empty PDFs fall back to binary upload.
 *
 * <p>Uses PDFBox 3 ({@link Loader}) — {@code sektor:etudes} already depends on 3.0.3.
 */
public final class PdfTextExtractor {

    private static final Logger log = LoggerFactory.getLogger(PdfTextExtractor.class);

    private static final int MAX_CHARS = 120_000;
    /** Below this, treat as scan / image PDF and keep binary path. */
    private static final int MIN_USEFUL_CHARS = 200;

    private PdfTextExtractor() {}

    public static boolean isPdfMime(String mimeType, String fileName) {
        if (mimeType != null) {
            String mime = mimeType.toLowerCase(Locale.ROOT);
            if (mime.contains("pdf")) {
                return true;
            }
        }
        return fileName != null && fileName.toLowerCase(Locale.ROOT).endsWith(".pdf");
    }

    /**
     * @return prompt text if the PDF has a usable text layer; otherwise {@code null}
     */
    public static String tryPromptText(byte[] bytes, String fileName) {
        return tryPromptText(bytes, fileName, MAX_CHARS);
    }

    /**
     * @param maxChars max characters kept after header (callers of light passes can lower this)
     * @return prompt text if the PDF has a usable text layer; otherwise {@code null}
     */
    public static String tryPromptText(byte[] bytes, String fileName, int maxChars) {
        if (bytes == null || bytes.length == 0) {
            return null;
        }
        int limit = maxChars > 0 ? maxChars : MAX_CHARS;
        String label = (fileName == null || fileName.isBlank()) ? "document.pdf" : fileName;
        try (PDDocument document = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String raw = stripper.getText(document);
            if (raw == null) {
                return null;
            }
            String text = raw.replace('\u0000', ' ').trim();
            if (text.length() < MIN_USEFUL_CHARS) {
                log.debug(
                        "PDF {} has little extractable text ({} chars) — keep binary path",
                        label,
                        text.length());
                return null;
            }
            StringBuilder out = new StringBuilder(text.length() + 64);
            out.append("PDF file: ")
                    .append(label)
                    .append(" (")
                    .append(document.getNumberOfPages())
                    .append(" pages)\n\n")
                    .append(text);
            return truncate(out.toString(), limit);
        } catch (Exception e) {
            log.warn("PDF text extraction failed for {}: {} — keep binary path", label, e.getMessage());
            return null;
        }
    }

    /**
     * Extract text for a page range (1-based, inclusive). Useful for chunked bordereau passes.
     *
     * @return prompt text if usable; otherwise {@code null}
     */
    public static String tryPromptTextPages(
            byte[] bytes, String fileName, int startPage, int endPage, int maxChars) {
        if (bytes == null || bytes.length == 0 || startPage < 1 || endPage < startPage) {
            return null;
        }
        int limit = maxChars > 0 ? maxChars : MAX_CHARS;
        String label = (fileName == null || fileName.isBlank()) ? "document.pdf" : fileName;
        try (PDDocument document = Loader.loadPDF(bytes)) {
            int pages = document.getNumberOfPages();
            if (pages == 0) {
                return null;
            }
            int from = Math.min(startPage, pages);
            int to = Math.min(endPage, pages);
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            stripper.setStartPage(from);
            stripper.setEndPage(to);
            String raw = stripper.getText(document);
            if (raw == null) {
                return null;
            }
            String text = raw.replace('\u0000', ' ').trim();
            if (text.length() < MIN_USEFUL_CHARS) {
                log.debug(
                        "PDF {} pages {}-{} have little text ({} chars)",
                        label,
                        from,
                        to,
                        text.length());
                return null;
            }
            StringBuilder out = new StringBuilder(text.length() + 96);
            out.append("PDF file: ")
                    .append(label)
                    .append(" (pages ")
                    .append(from)
                    .append('-')
                    .append(to)
                    .append(" of ")
                    .append(pages)
                    .append(")\n\n")
                    .append(text);
            return truncate(out.toString(), limit);
        } catch (Exception e) {
            log.warn(
                    "PDF page-range extraction failed for {} ({}-{}): {}",
                    label,
                    startPage,
                    endPage,
                    e.getMessage());
            return null;
        }
    }

    private static String truncate(String value, int maxChars) {
        if (value.length() <= maxChars) {
            return value;
        }
        return value.substring(0, maxChars) + "\n... (truncated)";
    }
}
