package ma.nafura.stock.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Create DTO for CostingMethod entity.
 * Auto-generated from costing-method.entity.json — do not edit.
 */
@Data
public class CostingMethodCreateDto {

    @NotBlank
    @Size(max = 60)
    private String code;

    @Size(max = 120)
    private String name;

    @Size(max = 2000)
    private String description;

    @Size(max = 120)
    private String method;

    private Boolean allowNegativeStock;

    @NotBlank
    @Size(max = 30)
    private String status;
}
