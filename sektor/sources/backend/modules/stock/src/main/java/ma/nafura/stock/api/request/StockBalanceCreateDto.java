package ma.nafura.stock.api.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class StockBalanceCreateDto {

    private UUID locationId;

    private UUID itemId;

    @Min(0)
    private BigDecimal quantity;

    @Min(0)
    private BigDecimal reservedQuantity;

    private LocalDate lastCountDate;
}
