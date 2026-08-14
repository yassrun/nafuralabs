package ma.nafura.platform.configuration.sysconfig.api.request;

import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Update DTO for ReferenceValue entity.
 * Auto-generated from reference-value.entity.json — do not edit.
 */
@Data
public class ReferenceValueUpdateDto {

    private UUID codeListId;

    @Size(max = 50)
    private String code;

    @Size(max = 200)
    private String name;

    @Min(0)
    private Integer sortOrder;
}

