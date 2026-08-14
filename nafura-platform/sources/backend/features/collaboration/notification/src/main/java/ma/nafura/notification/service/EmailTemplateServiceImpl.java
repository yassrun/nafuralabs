package ma.nafura.platform.collaboration.notification.service;

import ma.nafura.platform.collaboration.notification.domain.model.EmailTemplate;
import ma.nafura.platform.collaboration.notification.repository.EmailTemplateRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class EmailTemplateServiceImpl implements EmailTemplateService {

    private final EmailTemplateRepository repository;
    private final TemplateEngine emailTemplateEngine;

    public EmailTemplateServiceImpl(
            EmailTemplateRepository repository,
            @Qualifier("emailTemplateEngine") TemplateEngine emailTemplateEngine) {
        this.repository = repository;
        this.emailTemplateEngine = emailTemplateEngine;
    }

    @Override
    public Optional<EmailTemplate> get(UUID id) {
        return repository.findById(id);
    }

    @Override
    public EmailTemplate getById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Email template not found: " + id));
    }

    @Override
    public Page<EmailTemplate> list(Boolean system, String entityType, Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        return repository.findAllBySystemAndEntityTypeAndTenant(system, entityType, tenantId, pageable);
    }

    @Override
    public List<EmailTemplate> listByEntityType(String entityType) {
        UUID tenantId = TenantContext.getTenantId();
        return repository.findByEntityTypeForTenant(entityType, tenantId);
    }

    @Override
    public RenderedEmail renderByCode(String code, Map<String, Object> variables) {
        EmailTemplate template = repository.findByCodeAndTenantIdIsNull(code)
                .orElseThrow(() -> new IllegalArgumentException("Email template not found for code: " + code));
        return render(template, variables);
    }

    @Override
    public RenderedEmail render(EmailTemplate template, Map<String, Object> variables) {
        String subject = process(template.getSubject(), variables);
        String htmlBody = template.getHtmlBody() != null && !template.getHtmlBody().isBlank()
                ? process(template.getHtmlBody(), variables)
                : "";
        String textBody = template.getTextBody() != null && !template.getTextBody().isBlank()
                ? process(template.getTextBody(), variables)
                : null;
        return new RenderedEmail(subject, htmlBody, textBody);
    }

    private String process(String templateBody, Map<String, Object> variables) {
        if (templateBody == null || templateBody.isBlank()) {
            return "";
        }
        Context context = new Context(Locale.getDefault());
        variables.forEach(context::setVariable);
        return emailTemplateEngine.process(templateBody, context);
    }

    @Override
    @Transactional
    public EmailTemplate create(EmailTemplateCreateRequest request) {
        UUID tenantId = Boolean.TRUE.equals(request.isSystem()) ? null : TenantContext.getTenantId();
        OffsetDateTime now = OffsetDateTime.now();
        EmailTemplate t = EmailTemplate.builder()
                .tenantId(tenantId)
                .code(request.code())
                .name(request.name())
                .subject(request.subject())
                .htmlBody(request.htmlBody())
                .textBody(request.textBody())
                .entityType(request.entityType())
                .isSystem(request.isSystem() != null ? request.isSystem() : false)
                .createdAt(now)
                .updatedAt(now)
                .build();
        return repository.save(t);
    }

    @Override
    @Transactional
    public EmailTemplate update(UUID id, EmailTemplateUpdateRequest request) {
        EmailTemplate t = getById(id);
        t.setName(request.name());
        t.setSubject(request.subject());
        t.setHtmlBody(request.htmlBody());
        t.setTextBody(request.textBody());
        t.setUpdatedAt(OffsetDateTime.now());
        return repository.save(t);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }
}
