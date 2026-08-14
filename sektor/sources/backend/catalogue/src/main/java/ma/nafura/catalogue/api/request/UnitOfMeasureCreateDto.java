package ma.nafura.catalogue.api.request;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Create DTO for UnitOfMeasure entity.
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

    @NotNull
    @DecimalMin(value = "0", inclusive = false)
    private BigDecimal facteurVersBase = BigDecimal.ONE;

    @NotNull
    private Boolean estBase = false;

    private Boolean isActive;
}
