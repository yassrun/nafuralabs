package ma.nafura.finance.api.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LettrageDetailDto {

    private UUID id;
    private String codeLettrage;
    private String comptePcg;
    private List<String> ligneKeys;
    private String status;
    private BigDecimal totalDebit;
    private BigDecimal totalCredit;
    private BigDecimal difference;
    private OffsetDateTime createdAt;
}
