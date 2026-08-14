package ma.nafura.finance.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LettrageCandidateDto {

    private String ligneKey;
    private UUID ecritureId;
    private UUID ligneId;
    private LocalDate date;
    private String piece;
    private String libelle;
    private BigDecimal debit;
    private BigDecimal credit;
}
