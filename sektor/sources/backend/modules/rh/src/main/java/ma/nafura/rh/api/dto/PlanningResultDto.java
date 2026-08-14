package ma.nafura.rh.api.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanningResultDto {

    private List<PlanningEntryDto> entries;
    private List<PlanningAffectationDto> affectations;
}
