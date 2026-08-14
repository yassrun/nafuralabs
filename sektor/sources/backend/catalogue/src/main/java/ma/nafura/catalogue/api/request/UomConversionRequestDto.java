package ma.nafura.catalogue.api.request;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UomConversionRequestDto {

    @NotNull
    private UUID fromUomId;

    @NotNull
    private UUID toUomId;

    @NotNull
    private BigDecimal quantity;
}
