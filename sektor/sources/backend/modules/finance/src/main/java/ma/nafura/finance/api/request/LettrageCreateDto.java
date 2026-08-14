package ma.nafura.finance.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
import lombok.Data;

@Data
public class LettrageCreateDto {

    @NotEmpty
    private List<String> ligneKeys;

    @NotBlank
    @Size(max = 10)
    private String accountRadical;

    private BigDecimal tolerance;

    private Boolean allowPartial;
}
