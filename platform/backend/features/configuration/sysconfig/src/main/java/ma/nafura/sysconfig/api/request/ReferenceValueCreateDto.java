package ma.nafura.platform.configuration.sysconfig.api.request;

import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Create DTO for ReferenceValue entity.
 * Auto-generated from reference-value.entity.json — do not edit.
 */
@Data
public class ReferenceValueCreateDto {

    private UUID codeListId;

    @NotBlank
    @Size(max = 50)
    private String code;

    @NotBlank
    @Size(max = 200)
    private String name;

    @Min(0)
    private Integer sortOrder;
}

