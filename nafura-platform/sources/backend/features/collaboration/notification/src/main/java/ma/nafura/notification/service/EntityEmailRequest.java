package ma.nafura.platform.collaboration.notification.service;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

/**
 * Request body for POST /api/v1/platform/email/send (entity email with optional PDF).
 */
public record EntityEmailRequest(
    @NotEmpty(message = "At least one 'to' recipient is required")
    List<String> to,

    List<String> cc,

    @NotNull
    UUID emailTemplateId,

    @NotNull
    String entityType,

    @NotNull
    UUID entityId,

    boolean attachPdf,

    UUID printTemplateId
) {
    public List<String> cc() {
        return cc != null ? cc : List.of();
    }
}
