package ma.nafura.stock.api.request;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Update DTO for InventoryTxLine entity.
 * Auto-generated from inventory-tx-line.entity.json — do not edit.
 */
@Data
public class InventoryTxLineUpdateDto {

    private UUID inventoryTxId;

    @Min(1)
    private Integer lineNumber;

    private UUID itemId;

    @Min(0)
    private BigDecimal quantity;

    @Min(0)
    private BigDecimal unitPrice;

    @Min(0)
    private BigDecimal totalPrice;

    @Size(max = 2000)
    private String notes;
}
