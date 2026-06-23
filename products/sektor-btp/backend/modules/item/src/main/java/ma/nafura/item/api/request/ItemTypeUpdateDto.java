package ma.nafura.item.api.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Update DTO for ItemType entity.
 * Auto-generated from item-type.entity.json — do not edit.
 */
@Data
public class ItemTypeUpdateDto {

    @Size(max = 50)
    private String code;

    @Size(max = 200)
    private String name;

    @Size(max = 2000)
    private String description;

    private Boolean isActive;
}
