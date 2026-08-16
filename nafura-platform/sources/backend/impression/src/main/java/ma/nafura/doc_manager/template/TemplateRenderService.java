package ma.nafura.platform.collaboration.docmanager.template;

import ma.nafura.platform.collaboration.docmanager.domain.model.DocumentTemplate;
import ma.nafura.platform.collaboration.docmanager.repository.DocumentTemplateRepository;
import ma.nafura.platform.collaboration.docmanager.service.DocumentSettingsService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.exceptions.TemplateProcessingException;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Renders document templates with entity/tenant/system variables to HTML then PDF.
 *
 * <p>Shared header and footer are rendered first and injected as HTML strings, so a template
 * pulls them in with {@code th:utext="${fragments.HEADER_DEFAULT}"} and the letterhead lives in
 * one place.
 */
@Service
public class TemplateRenderService {

    private final DocumentTemplateRepository templateRepository;
    private final TemplateVariableResolver variableResolver;
    private final DocumentFragmentService fragmentService;
    private final DocumentSettingsService settingsService;
    private final PdfGenerationService pdfService;
    private final TemplateEngine stringTemplateEngine;

    public TemplateRenderService(
            DocumentTemplateRepository templateRepository,
            TemplateVariableResolver variableResolver,
            DocumentFragmentService fragmentService,
            DocumentSettingsService settingsService,
            PdfGenerationService pdfService,
            @Qualifier("stringTemplateEngine") TemplateEngine stringTemplateEngine) {
        this.templateRepository = templateRepository;
        this.variableResolver = variableResolver;
        this.fragmentService = fragmentService;
        this.settingsService = settingsService;
        this.pdfService = pdfService;
        this.stringTemplateEngine = stringTemplateEngine;
    }

    /**
     * Render template with real entity data and return PDF bytes.
     */
    public byte[] render(UUID templateId, String entityType, UUID entityId) {
        DocumentTemplate template = getTemplateForTenant(templateId);
        String type = entityType != null ? entityType : template.getEntityType();
        Map<String, Object> variables = variableResolver.resolve(type, entityId);
        return toPdf(template, processTemplate(template.getTemplateBody(), variables));
    }

    /**
     * Render with sample data for preview (e.g. in template editor).
     */
    public byte[] renderPreview(UUID templateId) {
        DocumentTemplate template = getTemplateForTenant(templateId);
        Map<String, Object> variables = variableResolver.resolveForPreview(template.getEntityType());
        return toPdf(template, processTemplate(template.getTemplateBody(), variables));
    }

    /**
     * Render an unsaved body. This is what makes the editor usable: previewing the draft rather
     * than the stored version.
     *
     * @param entityId when set, real data for that record; otherwise sample data
     */
    public String renderDraftHtml(String templateBody, String entityType, UUID entityId) {
        return renderDraftHtml(templateBody, entityType, entityId, Map.of());
    }

    /**
     * @param fragmentOverrides fragments to use instead of the stored ones, so the customisation
     *                          screen can preview settings that are not saved yet
     */
    public String renderDraftHtml(
            String templateBody,
            String entityType,
            UUID entityId,
            Map<String, String> fragmentOverrides) {
        Map<String, Object> variables = entityId != null
                ? variableResolver.resolve(entityType, entityId)
                : variableResolver.resolveForPreview(entityType);
        return processTemplate(templateBody, variables, fragmentOverrides);
    }

    /** Variables that would be exposed to a template of this type, for diagnostics and tests. */
    public Map<String, Object> previewVariables(String entityType) {
        return variableResolver.resolveForPreview(entityType);
    }

    /** Turn already-rendered HTML into a PDF, with the tenant's running page footer. */
    public byte[] htmlToPdf(
            String html, String entityType, String paperSize, String orientation, String marginsCss) {
        return pdfService.htmlToPdf(
                html, null, pageFooterHtml(entityType), paperSize, orientation, marginsCss);
    }

    private byte[] toPdf(DocumentTemplate template, String html) {
        return pdfService.htmlToPdf(
                html,
                null,
                pageFooterHtml(template.getEntityType()),
                template.getPaperSize(),
                template.getOrientation(),
                template.getMarginsCss());
    }

    /** Page numbering, per the tenant's document settings. Null when they turned it off. */
    String pageFooterHtml(String entityType) {
        try {
            return settingsService.buildPageFooterHtml(settingsService.get(entityType));
        } catch (Exception e) {
            // Numbering is cosmetic: never fail a document over it.
            return null;
        }
    }

    private DocumentTemplate getTemplateForTenant(UUID templateId) {
        UUID tenantId = TenantContext.getTenantId();
        return templateRepository.findByIdAndTenantId(templateId, tenantId)
                .orElseThrow(() -> new TemplateRenderException("Template not found: " + templateId));
    }

    /**
     * Two passes: the shared fragments first (they see the same variables), then the template
     * body with those fragments available as ready-made HTML.
     */
    String processTemplate(String templateBody, Map<String, Object> variables) {
        return processTemplate(templateBody, variables, Map.of());
    }

    String processTemplate(
            String templateBody, Map<String, Object> variables, Map<String, String> fragmentOverrides) {
        if (templateBody == null || templateBody.isBlank()) {
            throw new TemplateRenderException("Template body is empty");
        }
        // Checked again at render time, not only on save: a body could predate the validator or
        // have been written straight to the database.
        TemplateBodyValidator.validate(templateBody);
        Map<String, String> fragments = renderFragments(variables, fragmentOverrides);
        Map<String, Object> withFragments = new LinkedHashMap<>(variables);
        withFragments.put("fragments", fragments);
        return process(templateBody, withFragments);
    }

    private Map<String, String> renderFragments(
            Map<String, Object> variables, Map<String, String> overrides) {
        Map<String, String> rendered = new LinkedHashMap<>();
        Map<String, String> sources = new LinkedHashMap<>(fragmentService.bodiesForCurrentTenant());
        if (overrides != null) {
            sources.putAll(overrides);
        }
        sources.forEach((code, body) -> {
            if (body == null || body.isBlank()) {
                rendered.put(code, "");
                return;
            }
            try {
                rendered.put(code, process(body, variables));
            } catch (TemplateRenderException e) {
                // A broken shared fragment must not take down every document: the block is
                // dropped and the failure surfaces in the editor when that fragment is edited.
                rendered.put(code, "");
            }
        });
        return rendered;
    }

    private String process(String body, Map<String, Object> variables) {
        Context context = new Context(Locale.getDefault());
        variables.forEach(context::setVariable);
        try {
            return stringTemplateEngine.process(body, context);
        } catch (TemplateProcessingException e) {
            throw TemplateRenderException.from(e);
        } catch (RuntimeException e) {
            throw new TemplateRenderException(e.getMessage(), e);
        }
    }
}
