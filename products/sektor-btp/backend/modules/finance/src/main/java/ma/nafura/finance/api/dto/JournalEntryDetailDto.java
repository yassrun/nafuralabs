package ma.nafura.finance.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class JournalEntryDetailDto {

    private UUID id;
    private String entryNumber;
    private UUID journalId;
    private String journalCode;
    private LocalDate entryDate;
    private Integer fiscalYear;
    private Integer period;
    private String reference;
    private String label;
    private String status;
    private String origin;
    private String originId;
    private BigDecimal totalDebit;
    private BigDecimal totalCredit;
    private OffsetDateTime validatedAt;
    private String notes;
    private List<JournalEntryLineDetailDto> lines;
}
