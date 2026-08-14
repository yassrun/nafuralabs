package ma.nafura.finance.api.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PaymentModeUpdateDto {

    @Size(max = 30)
    private String code;

    @Size(max = 100)
    private String name;

    private Boolean isActive;
}
