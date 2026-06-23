package ma.nafura.item.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Create DTO for ItemType entity.
 * Auto-generated from item-type.entity.json — do not edit.
 */
@Data
public class ItemTypeCreateDto {

    @NotBlank
    @Size(max = 50)
    private String code;

    @NotBlank
    @Size(max = 200)
    private String name;

    @Size(max = 2000)
    private String description;

    private Boolean isActive;
}
