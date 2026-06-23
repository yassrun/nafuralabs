package ma.nafura.item.api.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Update DTO for ItemPrice entity.
 * Auto-generated from item-price.entity.json — do not edit.
 */
@Data
public class ItemPriceUpdateDto {

    private UUID itemId;

    @Size(max = 30)
    private String priceType;

    private UUID currencyId;

    @Min(0)
    private BigDecimal unitPrice;

    @Min(0)
    private BigDecimal minQuantity;

    private LocalDate effectiveFrom;

    private LocalDate effectiveTo;
}
