package ma.nafura.finance.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class JournalEntryCreateDto {

    @NotNull
    private UUID journalId;

    @NotBlank
    @Size(max = 20)
    private String journalCode;

    @NotNull
    private LocalDate entryDate;

    private Integer fiscalYear;
    private Integer period;

    @Size(max = 100)
    private String reference;

    @NotBlank
    @Size(max = 500)
    private String label;

    @Size(max = 20)
    private String status;

    @Size(max = 50)
    private String origin;

    @Size(max = 100)
    private String originId;

    @Size(max = 500)
    private String notes;

    @NotEmpty
    @Valid
    private List<JournalEntryLineDto> lines;
}
