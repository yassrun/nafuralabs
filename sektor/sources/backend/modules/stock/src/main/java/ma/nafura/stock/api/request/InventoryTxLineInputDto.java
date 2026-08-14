package ma.nafura.stock.api.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class InventoryTxLineInputDto {

    private UUID id;

    @Min(1)
    private Integer lineNumber;

    private UUID itemId;

    @Min(0)
    private BigDecimal quantity;

    @Min(0)
    private BigDecimal theoreticalQty;

    @Min(0)
    private BigDecimal countedQty;

    @Min(0)
    private BigDecimal unitPrice;

    @Min(0)
    private BigDecimal totalPrice;

    @Size(max = 2000)
    private String notes;
}
