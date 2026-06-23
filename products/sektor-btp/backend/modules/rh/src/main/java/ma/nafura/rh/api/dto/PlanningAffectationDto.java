package ma.nafura.rh.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanningAffectationDto {

    private String id;
    private String employeId;
    private String employeNom;
    private String chantierId;
    private String chantierCode;
    private String dateDebut;
    private String dateFin;
    private Integer pourcentageTemps;
}
