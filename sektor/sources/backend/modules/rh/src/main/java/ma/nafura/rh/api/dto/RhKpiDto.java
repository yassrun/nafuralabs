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
public class RhKpiDto {

    private int effectifs;
    private BigDecimal masseSalarialeYTD;
    private double absenteisme;
    private double rotationAnnuelle;
}
