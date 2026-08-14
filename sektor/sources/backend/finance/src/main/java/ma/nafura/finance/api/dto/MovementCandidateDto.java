package ma.nafura.finance.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MovementCandidateDto {

    private String id;
    private String numero;
    private LocalDate date;
    private String libelle;
    private String reference;
    private BigDecimal recette;
    private BigDecimal depense;
    private UUID journalEntryId;
    private UUID journalEntryLineId;
}
