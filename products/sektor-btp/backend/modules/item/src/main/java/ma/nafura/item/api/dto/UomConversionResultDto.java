package ma.nafura.item.api.dto;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UomConversionResultDto {
    UUID fromUomId;
    String fromCode;
    UUID toUomId;
    String toCode;
    BigDecimal quantityFrom;
    BigDecimal quantityTo;
    UUID uomCategoryId;
}
