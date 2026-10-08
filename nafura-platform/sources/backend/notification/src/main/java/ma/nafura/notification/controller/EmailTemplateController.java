package ma.nafura.platform.collaboration.notification.controller;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.collaboration.notification.domain.model.EmailTemplate;
import ma.nafura.platform.collaboration.notification.repository.EmailTemplateRepository;
import ma.nafura.platform.collaboration.notification.service.EmailTemplateService;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.record.RecordController;
import ma.nafura.platform.framework.record.RecordRepository;
import ma.nafura.platform.framework.record.RecordRuleException;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Email templates visible to the tenant (custom rows plus platform system rows with {@code tenant_id} null).
 * Permissions: {@code administration.notifications.email-templates.{read,create,update,delete}}.
 */
@RestController
@RequestMapping("/api/v1/platform/email-templates")
@SecuredResource(domain = "administration", feature = "notifications", resource = "email-templates")
@RequiredArgsConstructor
public class EmailTemplateController extends RecordController<EmailTemplate> {

    private final EmailTemplateRepository repository;
    private final EmailTemplateService templateService;

    @Override
    protected RecordRepository<EmailTemplate> repository() {
        return repository;
    }

    @Override
    protected String recordResource() {
        return "records/email-template.json";
    }

    @Override
    protected String labelField() {
        return "name";
    }

    @Override
    protected Sort defaultSort() {
        return Sort.by(Sort.Direction.DESC, "updatedAt");
    }

    @Override
    protected boolean includeSharedTenantRows() {
        return true;
    }

    @Override
    protected Set<String> readOnlyFields() {
        return Set.of("isSystem", "typeLabel");
    }

    @Override
    protected Map<String, String> validate(EmailTemplate record, EmailTemplate previous) {
        if (previous == null && Boolean.TRUE.equals(record.getIsSystem())) {
            return Map.of("code", "Les modèles système ne peuvent pas être créés via l'API");
        }
        if (Boolean.TRUE.equals(record.getIsSystem())) {
            return Map.of();
        }
        UUID tenantId = TenantContext.getTenantId();
        String code = record.getCode() == null ? "" : record.getCode().trim();
        if (code.isEmpty()) {
            return Map.of("code", "Le code est requis");
        }
        boolean taken = previous == null
                ? repository.existsByCodeAndTenantId(code, tenantId)
                : repository.existsByCodeAndTenantIdAndIdNot(code, tenantId, previous.getId());
        if (taken) {
            return Map.of("code", "Ce code existe déjà");
        }
        return Map.of();
    }

    @Override
    protected void beforeSave(EmailTemplate record, EmailTemplate previous) {
        if (record.getCode() != null) {
            record.setCode(record.getCode().trim());
        }
        if (record.getName() != null) {
            record.setName(record.getName().trim());
        }
        if (previous == null) {
            record.setIsSystem(false);
            if (record.getHtmlBody() == null) {
                record.setHtmlBody("");
            }
        }
    }

    @Override
    protected void beforeDelete(EmailTemplate record) {
        if (Boolean.TRUE.equals(record.getIsSystem())) {
            throw RecordRuleException.refused("Les modèles système ne peuvent pas être supprimés");
        }
    }

    /**
     * Preview: render template with provided variables (e.g. sample data).
     */
    @PostMapping("/{id}/preview")
    @RequirePermission("read")
    public ResponseEntity<EmailTemplatePreviewResponse> preview(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, Object> variables) {
        EmailTemplate template = get(id);
        EmailTemplateService.RenderedEmail rendered = templateService.render(
                template,
                variables != null ? variables : Map.of());
        return ResponseEntity.ok(new EmailTemplatePreviewResponse(
                rendered.subject(),
                rendered.htmlBody(),
                rendered.textBody()));
    }

    public record EmailTemplatePreviewResponse(String subject, String htmlBody, String textBody) {}
}
