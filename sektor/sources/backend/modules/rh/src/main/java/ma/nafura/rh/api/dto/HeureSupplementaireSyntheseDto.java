package ma.nafura.rh.api.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HeureSupplementaireSyntheseDto {

    private String employeId;
    private String from;
    private String to;
    private BigDecimal heuresHS25;
    private BigDecimal heuresHS50;
    private BigDecimal heuresHS100;
    private BigDecimal montantHS25;
    private BigDecimal montantHS50;
    private BigDecimal montantHS100;
    private BigDecimal montantTotal;
    private long lignesValidees;
    private long lignesBrouillon;
}
