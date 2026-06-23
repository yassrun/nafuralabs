package ma.nafura.finance.api.dto;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VirementLineDto {
    private UUID id;
    private String beneficiaire;
    private String rib;
    private BigDecimal montant;
    private String motif;
    private String referencePiece;
}
