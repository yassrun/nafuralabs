package ma.nafura.item.api.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Update DTO for UoMCategory entity.
 * Auto-generated from uo-mcategory.entity.json — do not edit.
 */
@Data
public class UoMCategoryUpdateDto {

    @Size(max = 50)
    private String code;

    @Size(max = 200)
    private String name;

    private String description;

    private Boolean isActive;
}
