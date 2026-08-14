package ma.nafura.stock.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StockBalanceViewDto {
    private UUID id;
    private UUID locationId;
    private String locationCode;
    private String locationName;
    private String locationType;
    private UUID itemId;
    private String itemCode;
    private String itemName;
    private String itemCategoryName;
    private BigDecimal quantity;
    private BigDecimal reservedQuantity;
    private BigDecimal availableQuantity;
    private BigDecimal unitPrice;
    private BigDecimal totalValue;
    private LocalDate lastCountDate;
    private BigDecimal stockMin;
}
