package ma.nafura.hse.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Data;

@Data
public class VisiteMedicaleCreateDto {

    private String id;

    @NotBlank
    private String employeId;

    @NotBlank
    private String employeMatricule;

    @NotBlank
    private String employeNom;

    @NotBlank
    private String posteOccupe;

    @NotBlank
    private String type;

    @NotNull
    private LocalDate date;

    @NotBlank
    private String aptitude;

    @NotBlank
    private String medecinNom;

    private String restrictions;

    @NotNull
    private LocalDate prochaineEcheance;
}
