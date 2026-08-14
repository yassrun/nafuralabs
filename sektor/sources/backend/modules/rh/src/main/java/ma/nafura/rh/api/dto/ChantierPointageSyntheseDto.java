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
public class ChantierPointageSyntheseDto {

    private String chantierId;
    private String from;
    private String to;
    private long joursPointes;
    private long joursPresents;
    private BigDecimal heuresNormales;
    private BigDecimal heuresSup;
    private BigDecimal heuresTotal;
}
