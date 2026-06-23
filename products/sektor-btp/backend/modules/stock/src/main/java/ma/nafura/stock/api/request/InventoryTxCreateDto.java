package ma.nafura.stock.api.request;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Create DTO for InventoryTx entity.
 * Auto-generated from inventory-tx.entity.json — do not edit.
 */
@Data
public class InventoryTxCreateDto {

    @NotBlank
    @Size(max = 50)
    private String txNumber;

    @NotBlank
    @Size(max = 50)
    private String txType;

    private UUID warehouseId;

    private LocalDate txDate;

    @Size(max = 100)
    private String reference;

    @Size(max = 50)
    private String status;

    @Size(max = 2000)
    private String notes;
}
