package ma.nafura.platform.collaboration.docmanager.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentTemplateUpdateRequest {

    private String code;
    private String name;
    private String entityType;
    private String format;
    private String templateBody;
    private String paperSize;
    private String orientation;
    private String marginsCss;
    private String metadata;
    private Boolean isDefault;
    private Boolean isActive;
}
