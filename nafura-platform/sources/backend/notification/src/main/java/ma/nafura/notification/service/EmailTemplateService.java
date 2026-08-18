package ma.nafura.platform.collaboration.notification.service;

import ma.nafura.platform.collaboration.notification.domain.model.EmailTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service for loading and rendering email templates with variable substitution.
 */
public interface EmailTemplateService {

    Optional<EmailTemplate> get(UUID id);

    /** Throw if not found. */
    EmailTemplate getById(UUID id);

    Page<EmailTemplate> list(Boolean system, String entityType, Pageable pageable);

    /**
     * List email templates available for the given entity type (tenant + system).
     */
    List<EmailTemplate> listByEntityType(String entityType);

    /**
     * Render subject and body with the given variables (e.g. entity, tenant, currentUser).
     */
    RenderedEmail render(EmailTemplate template, Map<String, Object> variables);

    /** Load system template by code and render with variables. */
    RenderedEmail renderByCode(String code, Map<String, Object> variables);

    EmailTemplate create(EmailTemplateCreateRequest request);

    EmailTemplate update(UUID id, EmailTemplateUpdateRequest request);

    void delete(UUID id);

    record RenderedEmail(String subject, String htmlBody, String textBody) {}

    record EmailTemplateCreateRequest(String code, String name, String subject, String htmlBody, String textBody,
                                     String entityType, Boolean isSystem) {}

    record EmailTemplateUpdateRequest(String name, String subject, String htmlBody, String textBody) {}
}
