package ma.nafura.hse.api.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HseKpiDto {

    private double tf1;
    private double tf2;
    private double tg;
    private int joursSansAccident;
    private PyramideBirdDto pyramideBird;
    private List<HseKpiEvolutionMensuelleDto> evolutionMensuelle;
    private long heuresTravaillees;
}
