package ma.nafura.chantiers.api.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AttachementLigneDto {

    private String posteCode;
    private String designation;
    private BigDecimal quantiteExecutee;
    private String unite;
    private String zone;
}
