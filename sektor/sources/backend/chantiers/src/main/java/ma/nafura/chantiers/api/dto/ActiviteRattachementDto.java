package ma.nafura.chantiers.api.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ActiviteRattachementDto {

    private String id;
    private String activiteId;
    private String lotId;
    private String posteId;
    private BigDecimal quantitePrevue;
}
