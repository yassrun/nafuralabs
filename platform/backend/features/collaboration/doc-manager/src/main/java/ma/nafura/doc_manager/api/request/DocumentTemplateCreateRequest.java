package ma.nafura.platform.collaboration.docmanager.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentTemplateCreateRequest {

    @NotBlank
    private String code;

    @NotBlank
    private String name;

    @NotBlank
    private String entityType;

    /** Defaults to {@code pdf} when omitted. */
    private String format;

    private String templateBody;
    private String paperSize;
    private String orientation;
    private String marginsCss;
    private String metadata;
    private Boolean isDefault;
    private Boolean isActive;

    /** When set, copy body / page settings from this template (same tenant). */
    private UUID cloneFromId;
}
