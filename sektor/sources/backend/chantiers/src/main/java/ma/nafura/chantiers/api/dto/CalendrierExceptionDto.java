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
public class CalendrierExceptionDto {

    private String id;
    private LocalDate dateLocale;
    /** FERMETURE | OUVERTURE */
    private String type;
    private List<CalendrierCreneauDto> creneaux;
}
