package ma.nafura.hse.api.request;

import java.time.LocalDate;
import lombok.Data;

@Data
public class VisiteMedicaleUpdateDto {

    private String employeId;
    private String employeMatricule;
    private String employeNom;
    private String posteOccupe;
    private String type;
    private LocalDate date;
    private String aptitude;
    private String medecinNom;
    private String restrictions;
    private LocalDate prochaineEcheance;
}
