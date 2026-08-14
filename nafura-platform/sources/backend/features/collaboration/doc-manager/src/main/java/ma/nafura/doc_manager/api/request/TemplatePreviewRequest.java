package ma.nafura.platform.collaboration.docmanager.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

/**
 * Preview an unsaved template body. Nothing is persisted — this is what lets the editor show
 * what is being typed instead of the stored version.
 */
@Data
public class TemplatePreviewRequest {

    @NotBlank
    private String templateBody;

    /** Drives which variables are resolved. */
    private String entityType;

    private String paperSize;

    private String orientation;

    private String marginsCss;

    /** When set, render with this record's real data instead of sample data. */
    private UUID sampleEntityId;

    /** "html" (fast, for live preview) or "pdf" (final fidelity). */
    private String format = "html";

    public boolean wantsPdf() {
        return "pdf".equalsIgnoreCase(format);
    }
}
