package ma.nafura.item.api.request;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Create DTO for UnitOfMeasure entity.
 * Auto-generated from unit-of-measure.entity.json — do not edit.
 */
@Data
public class UnitOfMeasureCreateDto {

    @NotBlank
    @Size(max = 30)
    private String code;

    @NotBlank
    @Size(max = 100)
    private String name;

    private UUID uomCategoryId;

    private String description;

    private Boolean isActive;
}
