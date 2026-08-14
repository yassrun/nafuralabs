package ma.nafura.stock.api.request;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Create DTO for InventoryTxLine entity.
 * Auto-generated from inventory-tx-line.entity.json — do not edit.
 */
@Data
public class InventoryTxLineCreateDto {

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
