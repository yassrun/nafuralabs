package ma.nafura.finance.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AccountingJournalCreateDto {

    @NotBlank
    @Size(max = 20)
    private String code;

    @NotBlank
    @Size(max = 200)
    private String name;

    @NotBlank
    @Size(max = 30)
    private String journalType;

    @Size(max = 50)
    private String defaultCounterpartCode;

    private Boolean isActive;
}
