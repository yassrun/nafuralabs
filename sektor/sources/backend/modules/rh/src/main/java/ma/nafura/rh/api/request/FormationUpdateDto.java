package ma.nafura.rh.api.request;

import java.time.LocalDate;
import lombok.Data;

@Data
public class FormationUpdateDto {

    private String employeId;

    private String libelle;

    private LocalDate date;

    private String organisme;
}
