package ma.nafura.currency.api.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Update DTO for ExchangeRate entity.
 * Auto-generated from exchange-rate.entity.json — do not edit.
 */
@Data
public class ExchangeRateUpdateDto {

    private UUID fromCurrencyId;

    private UUID toCurrencyId;

    @Min(0)
    private BigDecimal rate;

    private LocalDate effectiveDate;

    @Size(max = 50)
    private String source;
}
