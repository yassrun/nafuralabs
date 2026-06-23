package ma.nafura.platform.configuration.sysconfig.api.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Update DTO for CodeList entity.
 * Auto-generated from code-list.entity.json — do not edit.
 */
@Data
public class CodeListUpdateDto {

    @Size(max = 50)
    private String code;

    @Size(max = 200)
    private String name;

    @Size(max = 2000)
    private String description;
}

