package ma.nafura.chantiers.api.request;

import java.time.LocalDate;
import lombok.Data;

@Data
public class ChantierAffectationUpdateDto {

    private String roleCode;

    private LocalDate dateDebut;

    private LocalDate dateFin;

    private Boolean isActive;
}
