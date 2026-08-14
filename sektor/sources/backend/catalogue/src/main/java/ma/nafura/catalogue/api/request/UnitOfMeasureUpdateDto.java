package ma.nafura.catalogue.api.request;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Update DTO for UnitOfMeasure entity.
 */
@Data
public class UnitOfMeasureUpdateDto {

    @Size(max = 30)
    private String code;

    @Size(max = 100)
    private String name;

    private UUID uomCategoryId;

    private String description;

    @DecimalMin(value = "0", inclusive = false)
    private BigDecimal facteurVersBase;

    private Boolean estBase;

    private Boolean isActive;
}
