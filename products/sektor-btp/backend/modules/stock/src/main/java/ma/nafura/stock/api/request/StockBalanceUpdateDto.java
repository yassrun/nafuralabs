package ma.nafura.stock.api.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.Min;
import lombok.Data;

/**
 * Update DTO for StockBalance entity.
 * Auto-generated from stock-balance.entity.json — do not edit.
 */
@Data
public class StockBalanceUpdateDto {

    private UUID warehouseId;

    private UUID itemId;

    @Min(0)
    private BigDecimal quantity;

    @Min(0)
    private BigDecimal reservedQuantity;

    @Min(0)
    private BigDecimal availableQuantity;

    private LocalDate lastCountDate;
}
