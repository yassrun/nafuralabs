package ma.nafura.platform.collaboration.docmanager.template;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

/**
 * Converts HTML to PDF through Gotenberg (headless Chromium).
 *
 * <p>Chosen over an in-process CSS 2.1 renderer so the browser preview and the printed PDF go
 * through the same engine: any divergence between the two is a defect users cannot diagnose. It
 * also brings modern CSS, real web fonts and repeating headers with page counters.
 */
@Service
public class PdfGenerationService {

    private static final Logger log = LoggerFactory.getLogger(PdfGenerationService.class);

    private static final String DEFAULT_PAPER_SIZE = "A4";
    private static final String DEFAULT_ORIENTATION = "portrait";
    /** Gotenberg expects inches. A4 defaults come from the CSS @page rule we inject. */
    private static final String DEFAULT_MARGINS = "20mm 15mm 20mm 15mm";

    private final GotenbergProperties properties;
    private final RestClient restClient;

    public PdfGenerationService(GotenbergProperties properties) {
        this.properties = properties;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) properties.getConnectTimeout().toMillis());
        factory.setReadTimeout((int) properties.getReadTimeout().toMillis());
        this.restClient = RestClient.builder()
                .baseUrl(properties.getUrl())
                .requestFactory(factory)
                .build();
    }

    /**
     * Render HTML to PDF.
     *
     * @param html        document body or full HTML document
     * @param paperSize   e.g. "A4", "Letter"; null = A4
     * @param orientation "portrait" or "landscape"; null = portrait
     * @param marginsCss  e.g. "20mm 15mm 20mm 15mm"; null = default
     * @return PDF bytes
     */
    public byte[] htmlToPdf(String html, String paperSize, String orientation, String marginsCss) {
        String size = paperSize != null && !paperSize.isBlank() ? paperSize : DEFAULT_PAPER_SIZE;
        String orient = orientation != null && !orientation.isBlank() ? orientation : DEFAULT_ORIENTATION;
        String margins = marginsCss != null && !marginsCss.isBlank() ? marginsCss : DEFAULT_MARGINS;

        String document = wrapWithPageStyle(html, size, orient, margins);

        // The renderer must not reach the network: a template with a remote URL is a way into
        // internal services and out with document contents.
        HtmlOutboundGuard.requireSelfContained(document);

        if (document.length() > properties.getMaxDocumentBytes()) {
            throw TemplateRenderException.pdf(
                    "Document trop volumineux pour le rendu PDF ("
                            + document.length()
                            + " caractères).",
                    null);
        }

        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("files", namedHtml(document));
        // Page geometry is driven by the injected @page rule.
        form.add("preferCssPageSize", "true");
        form.add("printBackground", "true");

        try {
            byte[] pdf = restClient
                    .post()
                    .uri("/forms/chromium/convert/html")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(form)
                    .retrieve()
                    .body(byte[].class);
            if (pdf == null || pdf.length == 0) {
                throw TemplateRenderException.pdf("Le service de rendu PDF a renvoyé un document vide.", null);
            }
            return pdf;
        } catch (ResourceAccessException e) {
            log.error("Gotenberg unreachable at {}", properties.getUrl(), e);
            throw TemplateRenderException.pdf(
                    "Service de rendu PDF injoignable. Réessayez ou contactez l'administrateur.", e);
        } catch (TemplateRenderException e) {
            throw e;
        } catch (Exception e) {
            log.error("PDF rendering failed", e);
            throw TemplateRenderException.pdf("Échec du rendu PDF : " + e.getMessage(), e);
        }
    }

    /** Gotenberg keys the conversion on a part literally named index.html. */
    private static HttpEntity<Resource> namedHtml(String document) {
        ByteArrayResource resource =
                new ByteArrayResource(document.getBytes(StandardCharsets.UTF_8)) {
                    @Override
                    public String getFilename() {
                        return "index.html";
                    }
                };
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_HTML);
        return new HttpEntity<>(resource, headers);
    }

    String wrapWithPageStyle(String html, String paperSize, String orientation, String margins) {
        String pageSize = paperSize.toUpperCase(Locale.ROOT);
        if ("LANDSCAPE".equalsIgnoreCase(orientation)) {
            pageSize = pageSize + " landscape";
        }
        String style = String.format(
                "<style>@page { size: %s; margin: %s; }"
                        // Repeat table headers across pages: without it a long line table loses
                        // its column titles from page 2 onwards.
                        + " thead { display: table-header-group; }"
                        + " tr, img { break-inside: avoid; }"
                        + "</style>",
                pageSize, margins);

        String trimmed = html.trim();
        String lower = trimmed.toLowerCase(Locale.ROOT);
        if (!lower.startsWith("<!doctype") && !lower.startsWith("<html")) {
            return "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"/>"
                    + style
                    + "</head><body>"
                    + html
                    + "</body></html>";
        }
        int headEnd = lower.indexOf("</head>");
        if (headEnd != -1) {
            return trimmed.substring(0, headEnd) + style + trimmed.substring(headEnd);
        }
        return "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"/>"
                + style
                + "</head><body>"
                + html
                + "</body></html>";
    }
}
