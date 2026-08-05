package ma.nafura.platform.collaboration.docmanager.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import ma.nafura.platform.collaboration.docmanager.api.request.DocumentSettingsPayload;
import ma.nafura.platform.collaboration.docmanager.domain.model.DocumentSettings;
import ma.nafura.platform.collaboration.docmanager.repository.DocumentSettingsRepository;
import ma.nafura.platform.collaboration.docmanager.template.DocumentFragmentService;
import ma.nafura.platform.collaboration.docmanager.template.DocumentTokenResolver;
import ma.nafura.platform.framework.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Reads and writes the customisation a tenant applies to their documents, and regenerates the
 * shared header and footer from it.
 *
 * <p>The tenant never supplies markup: fields are structured, free text is plain text with
 * whitelisted tokens, and the HTML is produced here.
 */
@Service
public class DocumentSettingsService {

    private static final Logger log = LoggerFactory.getLogger(DocumentSettingsService.class);

    /** Identity fields the header may show, in the order they are rendered. */
    private static final List<String> HEADER_FIELD_ORDER = List.of(
            "formeJuridique",
            "capital",
            "adresse",
            "ville",
            "telephone",
            "email",
            "siteWeb",
            "ice",
            "identifiantFiscal",
            "rc",
            "patente",
            "cnss");

    private final DocumentSettingsRepository repository;
    private final DocumentFragmentService fragmentService;
    private final ObjectMapper objectMapper;

    public DocumentSettingsService(
            DocumentSettingsRepository repository,
            DocumentFragmentService fragmentService,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.fragmentService = fragmentService;
        this.objectMapper = objectMapper;
    }

    /** Effective settings for a type: its override when present, otherwise tenant defaults. */
    public DocumentSettingsPayload get(String entityType) {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return DocumentSettingsPayload.defaults();
        }
        return (entityType != null && !entityType.isBlank()
                        ? repository.findByTenantIdAndEntityType(tenantId, entityType)
                        : repository.findByTenantIdAndEntityTypeIsNull(tenantId))
                .map(this::deserialize)
                .orElseGet(() -> entityType != null && !entityType.isBlank()
                        ? get(null)
                        : DocumentSettingsPayload.defaults());
    }

    @Transactional
    public DocumentSettingsPayload save(String entityType, DocumentSettingsPayload payload) {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new IllegalStateException("No tenant in context");
        }
        String type = (entityType != null && entityType.isBlank()) ? null : entityType;
        DocumentSettings row = (type != null
                        ? repository.findByTenantIdAndEntityType(tenantId, type)
                        : repository.findByTenantIdAndEntityTypeIsNull(tenantId))
                .orElseGet(() -> DocumentSettings.builder()
                        .tenantId(tenantId)
                        .entityType(type)
                        .build());
        row.setSettingsJson(serialize(payload));
        repository.save(row);

        // Fragments are derived state: regenerate them so the change is visible on every
        // document immediately, without the tenant touching a template.
        regenerateFragments(payload);
        return payload;
    }

    /** Restore the shipped defaults for a scope. */
    @Transactional
    public DocumentSettingsPayload reset(String entityType) {
        return save(entityType, DocumentSettingsPayload.defaults());
    }

    /**
     * Fragments the given settings would produce, without persisting anything — so the screen
     * previews what is being edited rather than the last saved state.
     */
    public Map<String, String> previewFragments(DocumentSettingsPayload payload) {
        return Map.of(
                DocumentFragmentService.HEADER_DEFAULT, buildHeaderHtml(payload),
                DocumentFragmentService.FOOTER_DEFAULT, buildFooterHtml(payload));
    }

    /** Rebuild HEADER_DEFAULT and FOOTER_DEFAULT from the settings. */
    void regenerateFragments(DocumentSettingsPayload payload) {
        fragmentService.upsert(
                DocumentFragmentService.HEADER_DEFAULT,
                "En-tête standard",
                DocumentFragmentService.SCOPE_HEADER,
                buildHeaderHtml(payload));
        fragmentService.upsert(
                DocumentFragmentService.FOOTER_DEFAULT,
                "Pied de page standard",
                DocumentFragmentService.SCOPE_FOOTER,
                buildFooterHtml(payload));
    }

    String buildHeaderHtml(DocumentSettingsPayload payload) {
        DocumentSettingsPayload.Header header = payload.header();
        String accent = DocumentTokenResolver.safeColor(payload.appearance().accentColor(), "#1a1a1a");
        String align = switch (header.layout()) {
            case DocumentSettingsPayload.Header.LAYOUT_LOGO_CENTER -> "center";
            case DocumentSettingsPayload.Header.LAYOUT_LOGO_RIGHT -> "right";
            default -> "left";
        };

        StringBuilder sb = new StringBuilder();
        sb.append("<div class=\"nf-doc-header\" style=\"text-align:")
                .append(align)
                .append(";border-bottom:2px solid ")
                .append(accent)
                .append(";padding-bottom:8px\">");
        if (header.showLogo()) {
            sb.append("<img th:if=\"${tenant.logo}\" th:src=\"${tenant.logo}\" alt=\"\" ")
                    .append("style=\"max-height:48px;max-width:170px;display:block;margin-bottom:6px\"/>");
        }
        sb.append("<div style=\"font-weight:600;color:")
                .append(accent)
                .append("\" th:text=\"${tenant.raisonSociale}\">Société</div>");

        // Ordered by HEADER_FIELD_ORDER, not by the order the checkboxes were ticked, so the
        // letterhead stays stable across edits.
        for (String field : HEADER_FIELD_ORDER) {
            if (!header.fields().contains(field)) {
                continue;
            }
            sb.append("<div style=\"font-size:9pt;color:#555\" th:if=\"${tenant.")
                    .append(field)
                    .append("}\" th:text=\"")
                    .append(labelPrefix(field))
                    .append("${tenant.")
                    .append(field)
                    .append("}\"></div>");
        }
        sb.append("</div>");
        return sb.toString();
    }

    String buildFooterHtml(DocumentSettingsPayload payload) {
        DocumentSettingsPayload.Footer footer = payload.footer();
        StringBuilder sb = new StringBuilder();
        sb.append("<div class=\"nf-doc-footer\" style=\"font-size:8pt;color:#666\">");

        String freeText = DocumentTokenResolver.toFragmentHtml(footer.text());
        if (!freeText.isEmpty()) {
            sb.append("<div>").append(freeText).append("</div>");
        }
        if (footer.showLegalIdentifiers()) {
            sb.append("<div>")
                    .append(legalSpan("raisonSociale", ""))
                    .append(legalSpan("ice", " — ICE "))
                    .append(legalSpan("rc", " — RC "))
                    .append(legalSpan("identifiantFiscal", " — IF "))
                    .append(legalSpan("patente", " — Patente "))
                    .append(legalSpan("cnss", " — CNSS "))
                    .append("</div>");
        }
        if (footer.showPageNumber()) {
            // Rendered by the PDF engine through CSS counters; hidden in the HTML preview.
            sb.append("<div class=\"nf-doc-page-number\">Page <span class=\"nf-page\"></span>")
                    .append(" / <span class=\"nf-pages\"></span></div>");
        }
        sb.append("</div>");
        return sb.toString();
    }

    private static String legalSpan(String field, String prefix) {
        String expression = prefix.isEmpty()
                ? "${tenant." + field + "}"
                : "'" + prefix + "' + ${tenant." + field + "}";
        return "<span th:if=\"${tenant." + field + "}\" th:text=\"" + expression + "\"></span>";
    }

    /** Identifiers read better with their abbreviation in front; contact details do not. */
    private static String labelPrefix(String field) {
        return switch (field) {
            case "ice" -> "'ICE ' + ";
            case "identifiantFiscal" -> "'IF ' + ";
            case "rc" -> "'RC ' + ";
            case "patente" -> "'Patente ' + ";
            case "cnss" -> "'CNSS ' + ";
            case "capital" -> "'Capital ' + ";
            case "telephone" -> "'Tél. ' + ";
            default -> "";
        };
    }

    private DocumentSettingsPayload deserialize(DocumentSettings row) {
        try {
            return objectMapper.readValue(row.getSettingsJson(), DocumentSettingsPayload.class);
        } catch (Exception e) {
            log.warn("Unreadable document settings for tenant {}, falling back to defaults",
                    row.getTenantId(), e);
            return DocumentSettingsPayload.defaults();
        }
    }

    private String serialize(DocumentSettingsPayload payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid document settings", e);
        }
    }
}
