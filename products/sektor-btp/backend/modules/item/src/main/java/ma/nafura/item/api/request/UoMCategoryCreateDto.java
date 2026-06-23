package ma.nafura.item.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Create DTO for UoMCategory entity.
 * Auto-generated from uo-mcategory.entity.json — do not edit.
 */
@Data
public class UoMCategoryCreateDto {

    @NotBlank
    @Size(max = 50)
    private String code;

    @NotBlank
    @Size(max = 200)
    private String name;

    private String description;

    private Boolean isActive;
}
