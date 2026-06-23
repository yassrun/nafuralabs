package ma.nafura.platform.collaboration.docmanager.template;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

/**
 * Converts HTML to PDF using OpenHTMLToPDF (PDFBox).
 */
@Service
public class PdfGenerationService {

    private static final String DEFAULT_PAPER_SIZE = "A4";
    private static final String DEFAULT_ORIENTATION = "portrait";
    private static final String DEFAULT_MARGINS = "20mm 15mm 20mm 15mm";

    /**
     * Render HTML to PDF with optional page setup.
     *
     * @param html        full HTML document (will be wrapped with @page if needed)
     * @param paperSize   e.g. "A4", "Letter"; null = A4
     * @param orientation "portrait" or "landscape"; null = portrait
     * @param marginsCss  e.g. "20mm 15mm 20mm 15mm"; null = default
     * @return PDF bytes
     */
    public byte[] htmlToPdf(String html, String paperSize, String orientation, String marginsCss) {
        String size = paperSize != null && !paperSize.isBlank() ? paperSize : DEFAULT_PAPER_SIZE;
        String orient = orientation != null && !orientation.isBlank() ? orientation : DEFAULT_ORIENTATION;
        String margins = marginsCss != null && !marginsCss.isBlank() ? marginsCss : DEFAULT_MARGINS;

        String wrapped = wrapWithPageStyle(html, size, orient, margins);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(wrapped, "");
            builder.toStream(out);
            builder.run();
            return out.toByteArray();
        } catch (Exception e) {
            throw new TemplateRenderException("PDF generation failed: " + e.getMessage(), e);
        }
    }

    private String wrapWithPageStyle(String html, String paperSize, String orientation, String margins) {
        String pageSize = paperSize.toUpperCase(Locale.ROOT);
        if ("LANDSCAPE".equals(orientation)) {
            pageSize = pageSize + " landscape";
        }
        String style = String.format(
                "<style>@page { size: %s; margin: %s; }</style>",
                pageSize, margins);
        // Ensure we have a proper document so @page is applied
        if (!html.trim().toLowerCase(Locale.ROOT).startsWith("<!doctype") && !html.trim().toLowerCase(Locale.ROOT).startsWith("<html")) {
            return "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"/>" + style + "</head><body>" + html + "</body></html>";
        }
        int headEnd = html.toLowerCase(Locale.ROOT).indexOf("</head>");
        if (headEnd != -1) {
            return html.substring(0, headEnd) + style + html.substring(headEnd);
        }
        return "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"/>" + style + "</head><body>" + html + "</body></html>";
    }
}
