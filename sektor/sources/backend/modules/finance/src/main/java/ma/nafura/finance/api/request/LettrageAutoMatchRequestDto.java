package ma.nafura.finance.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LettrageAutoMatchRequestDto {

    @NotBlank
    @Size(max = 10)
    private String accountRadical;

    private String partnerId;
}
