package ma.nafura.stock.api.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Create DTO for StockBalance entity.
 * Auto-generated from stock-balance.entity.json — do not edit.
 */
@Data
public class StockBalanceCreateDto {

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
