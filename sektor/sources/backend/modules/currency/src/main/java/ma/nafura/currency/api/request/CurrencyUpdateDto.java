package ma.nafura.currency.api.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Update DTO for Currency entity.
 * Auto-generated from currency.entity.json — do not edit.
 */
@Data
public class CurrencyUpdateDto {

    @Size(min = 3, max = 3)
    @Pattern(regexp = "^[A-Z]{3}$")
    private String code;

    @Size(max = 100)
    private String name;

    @Size(max = 10)
    private String symbol;

    @Min(0)
    @Max(6)
    private Integer decimalPlaces;

    private Boolean isActive;

    private Boolean isReference;
}
