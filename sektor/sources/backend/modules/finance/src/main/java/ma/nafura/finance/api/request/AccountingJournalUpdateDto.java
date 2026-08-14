package ma.nafura.finance.api.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AccountingJournalUpdateDto {

    @Size(max = 200)
    private String name;

    @Size(max = 30)
    private String journalType;

    @Size(max = 50)
    private String defaultCounterpartCode;

    private Boolean isActive;
}
