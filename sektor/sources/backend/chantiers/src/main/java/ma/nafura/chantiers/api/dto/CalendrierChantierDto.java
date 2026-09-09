package ma.nafura.chantiers.api.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendrierChantierDto {

    private String id;
    private String chantierId;
    /** STANDARD | HISTORIQUE */
    private String kind;
    private List<CalendrierVersionDto> versions;
}
