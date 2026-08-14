package ma.nafura.hse.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HseKpiEvolutionMensuelleDto {

    private String mois;
    private int at;
    private int atAvecArret;
    private int joursArret;
}
