package ma.nafura.platform.collaboration.docmanager.template;

import ma.nafura.platform.collaboration.docmanager.domain.model.DocumentTemplate;
import ma.nafura.platform.collaboration.docmanager.repository.DocumentTemplateRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Renders document templates with entity/tenant/system variables to HTML then PDF.
 */
@Service
public class TemplateRenderService {

    private final DocumentTemplateRepository templateRepository;
    private final TemplateVariableResolver variableResolver;
    private final PdfGenerationService pdfService;
    private final TemplateEngine stringTemplateEngine;

    public TemplateRenderService(
            DocumentTemplateRepository templateRepository,
            TemplateVariableResolver variableResolver,
            PdfGenerationService pdfService,
            @Qualifier("stringTemplateEngine") TemplateEngine stringTemplateEngine) {
        this.templateRepository = templateRepository;
        this.variableResolver = variableResolver;
        this.pdfService = pdfService;
        this.stringTemplateEngine = stringTemplateEngine;
    }

    /**
     * Render template with real entity data and return PDF bytes.
     */
    public byte[] render(UUID templateId, String entityType, UUID entityId) {
        DocumentTemplate template = getTemplateForTenant(templateId);
        Map<String, Object> variables = variableResolver.resolve(entityType, entityId);
        String html = processTemplate(template.getTemplateBody(), variables);
        return pdfService.htmlToPdf(
                html,
                template.getPaperSize(),
                template.getOrientation(),
                template.getMarginsCss());
    }

    /**
     * Render with sample data for preview (e.g. in template editor).
     */
    public byte[] renderPreview(UUID templateId) {
        DocumentTemplate template = getTemplateForTenant(templateId);
        Map<String, Object> variables = variableResolver.resolveForPreview(template.getEntityType());
        String html = processTemplate(template.getTemplateBody(), variables);
        return pdfService.htmlToPdf(
                html,
                template.getPaperSize(),
                template.getOrientation(),
                template.getMarginsCss());
    }

    private DocumentTemplate getTemplateForTenant(UUID templateId) {
        UUID tenantId = TenantContext.getTenantId();
        return templateRepository.findByIdAndTenantId(templateId, tenantId)
                .orElseThrow(() -> new TemplateRenderException("Template not found: " + templateId));
    }

    private String processTemplate(String templateBody, Map<String, Object> variables) {
        if (templateBody == null || templateBody.isBlank()) {
            throw new TemplateRenderException("Template body is empty");
        }
        Context context = new Context(Locale.getDefault());
        variables.forEach(context::setVariable);
        return stringTemplateEngine.process(templateBody, context);
    }
}
