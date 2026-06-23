package ma.nafura.approbations.api.request;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatricePouvoirUpdateDto {

    private BigDecimal seuilMin;
    private BigDecimal seuilMax;
    private String approbateurRole;
    private String label;
    private Integer ordre;
}
