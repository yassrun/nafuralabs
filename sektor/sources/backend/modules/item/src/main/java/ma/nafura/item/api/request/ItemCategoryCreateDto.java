package ma.nafura.item.api.request;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Create DTO for ItemCategory entity.
 * Auto-generated from item-category.entity.json — do not edit.
 */
@Data
public class ItemCategoryCreateDto {

    private UUID parentId;

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
