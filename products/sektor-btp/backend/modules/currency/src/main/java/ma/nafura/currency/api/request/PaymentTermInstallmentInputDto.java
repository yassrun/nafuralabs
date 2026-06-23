package ma.nafura.currency.api.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class PaymentTermInstallmentInputDto {

    @NotNull
    @Min(1)
    private Integer lineOrder;

    @NotNull
    @Min(0)
    @Max(100)
    private BigDecimal percentage;

    @NotNull
    @Min(0)
    private Integer daysOffset;

    @Size(max = 255)
    private String description;
}
