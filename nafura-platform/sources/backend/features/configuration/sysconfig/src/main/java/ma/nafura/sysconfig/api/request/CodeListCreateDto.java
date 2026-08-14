package ma.nafura.platform.configuration.sysconfig.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Create DTO for CodeList entity.
 * Auto-generated from code-list.entity.json — do not edit.
 */
@Data
public class CodeListCreateDto {

    @NotBlank
    @Size(max = 50)
    private String code;

    @NotBlank
    @Size(max = 200)
    private String name;

    @Size(max = 2000)
    private String description;
}

