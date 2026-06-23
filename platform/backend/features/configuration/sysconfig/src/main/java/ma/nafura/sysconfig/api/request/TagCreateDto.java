package ma.nafura.platform.configuration.sysconfig.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Create DTO for Tag entity.
 * Auto-generated from tag.entity.json — do not edit.
 */
@Data
public class TagCreateDto {

    @NotBlank
    @Size(max = 50)
    private String code;

    @NotBlank
    @Size(max = 200)
    private String name;

    @Size(max = 20)
    private String color;
}

