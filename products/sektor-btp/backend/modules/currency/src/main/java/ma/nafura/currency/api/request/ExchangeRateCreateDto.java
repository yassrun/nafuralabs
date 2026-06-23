package ma.nafura.currency.api.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Create DTO for ExchangeRate entity.
 * Auto-generated from exchange-rate.entity.json — do not edit.
 */
@Data
public class ExchangeRateCreateDto {

    private UUID fromCurrencyId;

    private UUID toCurrencyId;

    @Min(0)
    private BigDecimal rate;

    private LocalDate effectiveDate;

    @Size(max = 50)
    private String source;
}
