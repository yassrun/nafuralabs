package ma.nafura.item.api.request;

import java.util.UUID;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Update DTO for ItemCategory entity.
 * Auto-generated from item-category.entity.json — do not edit.
 */
@Data
public class ItemCategoryUpdateDto {

    private UUID parentId;

    @Size(max = 50)
    private String code;

    @Size(max = 200)
    private String name;

    @Size(max = 2000)
    private String description;

    private Boolean isActive;
}
