package ma.nafura.hse.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PyramideBirdDto {

    private int incidents;
    private int presquAccidents;
    private int at;
    private int atAvecArret;
    private double ratioPresquAccidentParAt;
    private double ratioIncidentParAt;
}
