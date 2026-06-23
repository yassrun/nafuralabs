package ma.nafura.finance.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class JournalEntryUpdateDto {

    private UUID journalId;

    @Size(max = 20)
    private String journalCode;

    private LocalDate entryDate;
    private Integer fiscalYear;
    private Integer period;

    @Size(max = 100)
    private String reference;

    @Size(max = 500)
    private String label;

    @Size(max = 500)
    private String notes;

    @Valid
    private List<JournalEntryLineDto> lines;
}
