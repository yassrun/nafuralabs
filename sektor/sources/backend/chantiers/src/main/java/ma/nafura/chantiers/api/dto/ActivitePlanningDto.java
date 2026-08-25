package ma.nafura.chantiers.api.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ActivitePlanningDto {

    private List<ActiviteChantierDto> activites;
    private List<ActivitePrecedenceDto> precedences;
}
