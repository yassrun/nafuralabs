package ma.nafura.platform.collaboration.docmanager.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    @NotBlank
    private String format;

    private String templateBody;
    private String paperSize;
    private String orientation;
    private String marginsCss;
    private String metadata;
    private Boolean isDefault;
    private Boolean isActive;
}
