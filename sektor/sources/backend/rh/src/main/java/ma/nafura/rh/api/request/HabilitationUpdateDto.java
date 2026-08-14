package ma.nafura.rh.api.request;

import java.time.LocalDate;
import lombok.Data;

@Data
public class HabilitationUpdateDto {

    private String employeId;

    private String code;

    private String libelle;

    private LocalDate dateObtention;

    private LocalDate dateExpiration;
}
