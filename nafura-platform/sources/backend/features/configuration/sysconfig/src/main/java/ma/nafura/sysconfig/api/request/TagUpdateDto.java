package ma.nafura.platform.configuration.sysconfig.api.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Update DTO for Tag entity.
 * Auto-generated from tag.entity.json — do not edit.
 */
@Data
public class TagUpdateDto {

    @Size(max = 50)
    private String code;

    @Size(max = 200)
    private String name;

    @Size(max = 20)
    private String color;
}

