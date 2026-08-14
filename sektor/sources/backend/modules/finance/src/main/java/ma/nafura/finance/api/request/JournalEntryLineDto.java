package ma.nafura.finance.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class JournalEntryLineDto {

    private Integer lineNumber;

    @NotBlank
    @Size(max = 50)
    private String accountCode;

    @Size(max = 255)
    private String accountLabel;

    @NotNull
    private BigDecimal debit;

    @NotNull
    private BigDecimal credit;

    @Size(max = 500)
    private String label;

    @Size(max = 100)
    private String analyticalAxis;

    @Size(max = 255)
    private String thirdPartyName;

    private LocalDate dueDate;
}
