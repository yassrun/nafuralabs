package ma.nafura.currency.api.request;

import java.math.BigDecimal;
import java.util.List;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Update DTO for PaymentTerm entity.
 * Auto-generated from payment-term.entity.json — do not edit.
 */
@Data
public class PaymentTermUpdateDto {

    @Size(max = 50)
    private String code;

    @Size(max = 200)
    private String name;

    @Min(0)
    @Max(365)
    private Integer days;

    @Min(0)
    private Integer discountDays;

    @Min(0)
    @Max(100)
    private BigDecimal discountPercent;

    @Size(max = 2000)
    private String description;

    private Boolean isActive;

    @Size(max = 30)
    private String termType;

    private Boolean isDefault;

    private String notes;

    private List<PaymentTermInstallmentInputDto> installments;
}
