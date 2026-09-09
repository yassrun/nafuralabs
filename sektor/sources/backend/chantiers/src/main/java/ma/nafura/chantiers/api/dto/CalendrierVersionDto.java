package ma.nafura.chantiers.api.dto;

import java.time.LocalDate;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendrierVersionDto {

    private String id;
    private LocalDate dateEffet;
    private String fuseauIana;
    private List<CalendrierCreneauDto> creneaux;
    private List<CalendrierExceptionDto> exceptions;
}
